"""Settings 설정 단위 테스트."""

from __future__ import annotations

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
