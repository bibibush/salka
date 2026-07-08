"""OpenAI GPT 기반 LLM 분석 어댑터.

최신 Responses API(`client.responses.parse`)로 Pydantic(`RawResult`) 구조화 출력을
강제하고, 검증/재시도 흐름(구조화 출력 → 검증 → 실패 시 재시도 1회 → 예외)을 따른다
(PDD §8). 프롬프트 단계에서 금지 단정어(유해/위험/안전) 사용을 차단한다(응답 정책
1차 방어). 성분 데이터는 메모리에서만 처리하며 저장하지 않는다.
"""

from __future__ import annotations

from openai import AsyncOpenAI, OpenAIError
from openai.types import ReasoningEffort
from openai.types.shared_params import Reasoning

from src.application.ports.llm_analysis_port import LlmAnalysisPort
from src.domain.entities.analysis_result import AnalysisResult
from src.domain.exceptions.domain_errors import (
    AnalysisValidationError,
    DomainError,
    LlmAnalysisError,
)
from src.infrastructure.llm.raw_result import RawResult, to_domain

_MAX_VALIDATION_RETRIES = 1

_SYSTEM_PROMPT = (
    "당신은 화장품 전성분을 참고용으로 해석해 주는 보조 도구입니다. "
    "의학적 진단·처방·안전성 보증이 아니라, 공개된 성분 정보를 바탕으로 한 참고 의견만 제공합니다. "
    "각 성분을 참고형 어조로 설명하고, 다음 규칙을 반드시 지키세요.\n"
    "- 강한 단정 표현('유해', '위험', '안전')을 절대 사용하지 마세요. "
    "대신 '자극을 줄 수 있어 참고가 필요합니다' 같은 참고형 문구를 사용하세요.\n"
    "- overall_score와 각 성분 score는 0~100 정수입니다.\n"
    "- verdict는 GOOD/CAUTION/BAD 중 하나입니다.\n"
    "- recommendation은 RECOMMENDED/NEUTRAL/CAUTION_NEEDED 중 하나입니다.\n"
    "- 주의가 필요한 성분은 cautions에 이유와 함께 포함하세요.\n"
    "- 모든 문구는 한국어로 작성합니다."
)


class OpenAiLlmAnalysisAdapter(LlmAnalysisPort):
    """OpenAI Responses API 구조화 출력을 사용하는 LLM 분석 구현체."""

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        reasoning_effort: ReasoningEffort = "medium",
        client: AsyncOpenAI | None = None,
    ) -> None:
        if not api_key and client is None:
            raise ValueError("OpenAI API 키가 설정되지 않았습니다. LLM_API_KEY를 지정하세요.")
        self._model = model
        self._reasoning_effort = reasoning_effort
        self._client = client or AsyncOpenAI(api_key=api_key)

    async def analyze(self, ingredients: list[str]) -> AnalysisResult:
        last_error: Exception | None = None
        for _ in range(_MAX_VALIDATION_RETRIES + 1):
            parsed = await self._complete(ingredients)
            if parsed is None:
                last_error = None
                continue
            try:
                return to_domain(parsed)
            except DomainError as exc:
                # 도메인 변환 실패(예: 점수 범위)는 검증 실패로 취급해 재시도한다.
                last_error = exc
        raise AnalysisValidationError("LLM 응답 검증에 반복 실패했습니다.") from last_error

    async def _complete(self, ingredients: list[str]) -> RawResult | None:
        """모델을 호출해 구조화된 `RawResult`를 반환한다 (거부/미생성 시 None)."""
        user_prompt = "다음 전성분을 분석해 주세요:\n" + "\n".join(ingredients)
        try:
            response = await self._client.responses.parse(
                model=self._model,
                instructions=_SYSTEM_PROMPT,
                input=user_prompt,
                reasoning=Reasoning(effort=self._reasoning_effort),
                text_format=RawResult,
            )
        except OpenAIError as exc:
            raise LlmAnalysisError("OpenAI 분석 호출에 실패했습니다.") from exc
        return response.output_parsed
