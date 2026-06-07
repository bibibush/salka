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
    llm_port = providers.Selector(
        providers.Callable(lambda s: s.llm_provider, settings),
        mock=providers.Singleton(MockLlmAnalysisAdapter),
    )

    ocr_port = providers.Selector(
        providers.Callable(lambda s: s.ocr_provider, settings),
        mock=providers.Singleton(MockOcrAdapter),
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
