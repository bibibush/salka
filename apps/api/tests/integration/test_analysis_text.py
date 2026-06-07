"""성분 텍스트 분석 통합 테스트."""

from __future__ import annotations

from httpx import AsyncClient

_ENDPOINT = "/api/v1/analysis/by-ingredients-text"


async def test_analyze_text_success(client: AsyncClient) -> None:
    response = await client.post(_ENDPOINT, json={"ingredients": "Water, Niacinamide, Fragrance"})
    assert response.status_code == 200

    body = response.json()
    assert 0 <= body["overall_score"] <= 100
    assert body["verdict"] in {"GOOD", "CAUTION", "BAD"}
    assert body["recommendation"] in {"RECOMMENDED", "NEUTRAL", "CAUTION_NEEDED"}
    assert len(body["assessments"]) == 3
    # 면책 문구가 항상 포함된다
    assert body["disclaimer"]


async def test_analyze_text_empty_ingredients_returns_problem(client: AsyncClient) -> None:
    response = await client.post(_ENDPOINT, json={"ingredients": " , ; · "})
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")

    body = response.json()
    assert body["status"] == 422
    assert body["instance"] == _ENDPOINT
    assert "title" in body


async def test_analyze_text_missing_field_returns_problem(client: AsyncClient) -> None:
    response = await client.post(_ENDPOINT, json={})
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")
