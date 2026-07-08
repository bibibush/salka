"""OpenAI LLM 어댑터 단위 테스트 (fake client, 네트워크 없음)."""

from __future__ import annotations

import pytest
from openai import OpenAIError
from src.domain.exceptions.domain_errors import AnalysisValidationError, LlmAnalysisError
from src.infrastructure.llm.openai_llm_analysis_adapter import OpenAiLlmAnalysisAdapter
from src.infrastructure.llm.raw_result import RawResult

_VALID = RawResult.model_validate(
    {
        "overall_score": 82,
        "verdict": "GOOD",
        "summary": "참고용 요약입니다.",
        "recommendation": "RECOMMENDED",
        "assessments": [
            {"ingredient": "Water", "verdict": "GOOD", "score": 80, "reason": "널리 쓰입니다."},
        ],
        "cautions": [],
    }
)


# --- OpenAI Responses API 응답 형태를 흉내 내는 fake ---------------------------


class _FakeResponse:
    def __init__(self, parsed: RawResult | None) -> None:
        self.output_parsed = parsed


class _FakeResponses:
    def __init__(
        self,
        results: list[RawResult | None] | None = None,
        raises: Exception | None = None,
    ) -> None:
        self._results = list(results or [])
        self._raises = raises
        self.calls: list[dict[str, object]] = []

    async def parse(self, **kwargs: object) -> _FakeResponse:
        self.calls.append(kwargs)
        if self._raises is not None:
            raise self._raises
        return _FakeResponse(self._results.pop(0))


class _FakeClient:
    def __init__(
        self,
        results: list[RawResult | None] | None = None,
        raises: Exception | None = None,
    ) -> None:
        self.responses = _FakeResponses(results, raises)


def _adapter(client: _FakeClient, *, reasoning_effort: str = "medium") -> OpenAiLlmAnalysisAdapter:
    return OpenAiLlmAnalysisAdapter(
        api_key="test-key",
        model="gpt-5.5",
        reasoning_effort=reasoning_effort,
        client=client,
    )


async def test_analyze_maps_valid_output_to_domain() -> None:
    adapter = _adapter(_FakeClient(results=[_VALID]))
    result = await adapter.analyze(["Water"])

    assert result.overall_score.value == 82
    assert result.verdict.value == "GOOD"
    assert len(result.assessments) == 1
    assert result.assessments[0].score.value == 80


async def test_analyze_none_output_retries_then_validation_error() -> None:
    client = _FakeClient(results=[None, None])
    adapter = _adapter(client)
    with pytest.raises(AnalysisValidationError):
        await adapter.analyze(["Water"])
    # 재시도 1회 → parse 2회 호출
    assert len(client.responses.calls) == 2


async def test_analyze_api_error_wrapped_as_llm_analysis_error() -> None:
    adapter = _adapter(_FakeClient(raises=OpenAIError("boom")))
    with pytest.raises(LlmAnalysisError):
        await adapter.analyze(["Water"])


async def test_reasoning_effort_forwarded_to_model_call() -> None:
    client = _FakeClient(results=[_VALID])
    adapter = _adapter(client, reasoning_effort="high")
    await adapter.analyze(["Water"])
    assert client.responses.calls[0]["reasoning"] == {"effort": "high"}


def test_missing_api_key_fails_fast() -> None:
    with pytest.raises(ValueError):
        OpenAiLlmAnalysisAdapter(api_key=None, model="gpt-5.5")
