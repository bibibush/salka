"""Settings 설정 단위 테스트."""

from __future__ import annotations

from pathlib import Path

import pytest
from src.core.config import Settings


@pytest.mark.parametrize(
    ("env_name", "attr", "expected"),
    [
        ("OPENAI_MODEL", "openai_model", "gpt-5.5"),
        ("GEMINI_MODEL", "gemini_model", "gemini-3.5-flash"),
        ("OPENAI_REASONING_EFFORT", "openai_reasoning_effort", "medium"),
        ("GEMINI_THINKING_LEVEL", "gemini_thinking_level", "medium"),
    ],
)
def test_model_and_tuning_defaults_ignore_env(
    monkeypatch: pytest.MonkeyPatch,
    env_name: str,
    attr: str,
    expected: str,
) -> None:
    """모델·튜닝 값은 Settings 객체에 고정되어 env로 재정의되지 않는다."""
    monkeypatch.setenv(env_name, "should-be-ignored")

    settings = Settings(_env_file=None)  # type: ignore[call-arg]

    assert getattr(settings, attr) == expected


def test_cors_origins_parses_comma_string_from_dotenv(tmp_path: Path) -> None:
    """`.env` 의 콤마 구분 CORS_ORIGINS 문자열을 리스트로 파싱해야 한다.

    pydantic-settings 는 dotenv 소스의 복합(list) 필드를 검증기 이전에 JSON 으로
    디코딩하려 하므로, 콤마 문자열이 그대로 오면 파싱 에러가 난다. 이 계약을
    보장한다(관찰 가능한 동작: `.env` 로 기동해도 리스트로 해석된다).
    """
    env_file = tmp_path / ".env"
    env_file.write_text(
        "CORS_ORIGINS=http://localhost:3000,http://localhost:5173\n",
        encoding="utf-8",
    )

    settings = Settings(_env_file=str(env_file))  # type: ignore[call-arg]

    assert settings.cors_origins == [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
