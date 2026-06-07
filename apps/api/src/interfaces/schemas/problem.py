"""RFC 7807 Problem Details 스키마.

모든 오류 응답은 `application/problem+json` 미디어 타입으로 이 형태를 반환한다.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

PROBLEM_JSON_MEDIA_TYPE = "application/problem+json"


class ProblemDetail(BaseModel):
    """RFC 7807 problem detail 본문."""

    type: str = Field(default="about:blank", description="문제 유형 식별 URI")
    title: str = Field(description="사람이 읽을 수 있는 요약")
    status: int = Field(description="HTTP 상태 코드")
    detail: str | None = Field(default=None, description="이 발생 건에 대한 상세 설명")
    instance: str | None = Field(default=None, description="문제가 발생한 요청 경로")
