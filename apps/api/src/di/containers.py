"""dependency-injector 컨테이너.

외부 의존성(LLM/OCR)은 환경변수(`LLM_PROVIDER`, `OCR_PROVIDER`)로 구현체를
선택해 주입한다. 테스트에서는 provider override로 mock 외 구현으로 교체할 수 있다.
Phase 1은 mock 구현체만 등록한다.
"""

from __future__ import annotations

from dependency_injector import containers, providers

from src.application.use_cases.analyze_by_ingredients_image import (
    AnalyzeByIngredientsImageUseCase,
)
from src.application.use_cases.analyze_by_ingredients_text import (
    AnalyzeByIngredientsTextUseCase,
)
from src.core.config import Settings, get_settings
from src.infrastructure.llm.mock_llm_analysis_adapter import MockLlmAnalysisAdapter
from src.infrastructure.llm.openai_llm_analysis_adapter import OpenAiLlmAnalysisAdapter
from src.infrastructure.ocr.gemini_ocr_adapter import GeminiOcrAdapter
from src.infrastructure.ocr.mock_ocr_adapter import MockOcrAdapter


class Container(containers.DeclarativeContainer):
    """애플리케이션 의존성 그래프."""

    wiring_config = containers.WiringConfiguration(
        modules=[
            "src.interfaces.api.v1.analysis_router",
        ]
    )

    settings: providers.Provider[Settings] = providers.Singleton(get_settings)

    # --- 외부 의존성 Port 구현체 (provider 선택) ---
    # Selector는 선택된 키의 provider만 인스턴스화하므로, mock 사용 시 실제 어댑터의
    # 생성자(및 API 키 fail-fast)는 호출되지 않는다.
    llm_port = providers.Selector(
        providers.Callable(lambda s: s.llm_provider, settings),
        mock=providers.Singleton(MockLlmAnalysisAdapter),
        openai=providers.Singleton(
            OpenAiLlmAnalysisAdapter,
            api_key=providers.Callable(lambda s: s.llm_api_key, settings),
            model=providers.Callable(lambda s: s.openai_model, settings),
            reasoning_effort=providers.Callable(lambda s: s.openai_reasoning_effort, settings),
        ),
    )

    ocr_port = providers.Selector(
        providers.Callable(lambda s: s.ocr_provider, settings),
        mock=providers.Singleton(MockOcrAdapter),
        gemini=providers.Singleton(
            GeminiOcrAdapter,
            api_key=providers.Callable(lambda s: s.ocr_api_key, settings),
            model=providers.Callable(lambda s: s.gemini_model, settings),
            thinking_level=providers.Callable(lambda s: s.gemini_thinking_level, settings),
        ),
    )

    _disclaimer_text = providers.Callable(lambda s: s.disclaimer_text, settings)

    # --- Use cases ---
    analyze_by_text_use_case = providers.Factory(
        AnalyzeByIngredientsTextUseCase,
        llm_port=llm_port,
        disclaimer_text=_disclaimer_text,
    )

    analyze_by_image_use_case = providers.Factory(
        AnalyzeByIngredientsImageUseCase,
        ocr_port=ocr_port,
        llm_port=llm_port,
        disclaimer_text=_disclaimer_text,
    )
