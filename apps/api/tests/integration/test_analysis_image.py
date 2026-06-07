"""성분 이미지 분석 통합 테스트."""

from __future__ import annotations

from httpx import AsyncClient

_ENDPOINT = "/api/v1/analysis/by-ingredients-image"


async def test_analyze_image_success(client: AsyncClient) -> None:
    files = {"image": ("label.png", b"fake-image-bytes", "image/png")}
    response = await client.post(_ENDPOINT, files=files)
    assert response.status_code == 200

    body = response.json()
    assert len(body["assessments"]) >= 1
    assert body["disclaimer"]


async def test_analyze_image_rejects_non_image(client: AsyncClient) -> None:
    files = {"image": ("notes.txt", b"hello", "text/plain")}
    response = await client.post(_ENDPOINT, files=files)
    assert response.status_code == 415
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["status"] == 415


async def test_analyze_image_rejects_oversized(client: AsyncClient) -> None:
    # conftest의 settings.max_upload_bytes = 1024
    files = {"image": ("big.png", b"x" * 2048, "image/png")}
    response = await client.post(_ENDPOINT, files=files)
    assert response.status_code == 413
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["status"] == 413
