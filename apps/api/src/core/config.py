"""애플리케이션 설정 (pydantic-settings).

환경변수 또는 `.env` 파일에서 값을 읽는다. PDD §12 참고.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, ClassVar, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

ProviderName = str

DEFAULT_DISCLAIMER = (
    "본 결과는 공개된 성분 정보를 바탕으로 한 참고용 해석이며, "
    "의학적 진단이나 안전성 보증이 아닙니다. "
    "민감 반응이나 질환이 있는 경우 전문가와 상담하세요."
)


class Settings(BaseSettings):
    """런타임 설정값."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    env: Literal["dev", "staging", "prod"] = "dev"

    # 외부 의존성 provider (Phase 1 기본값: mock)
    llm_provider: ProviderName = "mock"
    ocr_provider: ProviderName = "mock"
    llm_api_key: str | None = None
    ocr_api_key: str | None = None

    # provider별 모델·튜닝 기본값. env로 재정의하지 않고 이 Settings 객체에 고정한다
    # (ClassVar → pydantic-settings 필드가 아니므로 환경변수 소스 대상에서 제외).
    # provider=mock이면 사용되지 않는다.
    openai_model: ClassVar[str] = "gpt-5.5"
    gemini_model: ClassVar[str] = "gemini-3.5-flash"
    # 추론 강도. provider별 튜닝 값이며 어댑터 밖(Port/use case)으로 노출하지 않는다.
    # OpenAI=reasoning effort, Gemini=thinking level (동일 값 체계).
    openai_reasoning_effort: ClassVar[Literal["minimal", "low", "medium", "high"]] = "medium"
    gemini_thinking_level: ClassVar[Literal["minimal", "low", "medium", "high"]] = "medium"

    # CORS 허용 origin 화이트리스트.
    # NoDecode: pydantic-settings 가 env/dotenv 값을 JSON 으로 미리 디코딩하지 않도록
    # 막아, 아래 `_split_cors_origins`(mode="before")가 콤마 문자열을 직접 분리한다.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8081",
        ]
    )

    # Rate limit (Phase 2에서 본격 적용)
    rate_limit_per_min: int = 60

    # 업로드 이미지 최대 크기 (기본 8MB)
    max_upload_bytes: int = 8 * 1024 * 1024

    # 모든 분석 응답에 부착되는 면책 문구
    disclaimer_text: str = DEFAULT_DISCLAIMER

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """콤마로 구분된 문자열도 허용한다."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """프로세스 단위로 캐시된 설정 인스턴스."""
    return Settings()
