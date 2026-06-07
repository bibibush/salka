"""분석 API 라우터 (Phase 1).

POST /analysis/by-ingredients-text
POST /analysis/by-ingredients-image
"""

from __future__ import annotations

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, UploadFile

from src.application.use_cases.analyze_by_ingredients_image import (
    AnalyzeByIngredientsImageUseCase,
)
from src.application.use_cases.analyze_by_ingredients_text import (
    AnalyzeByIngredientsTextUseCase,
)
from src.core.config import Settings
from src.di.containers import Container
from src.interfaces.errors import ProblemException
from src.interfaces.schemas.analysis_schemas import (
    AnalysisResultSchema,
    AnalyzeByTextRequest,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/by-ingredients-text", response_model=AnalysisResultSchema)
@inject
async def analyze_by_ingredients_text(
    payload: AnalyzeByTextRequest,
    use_case: AnalyzeByIngredientsTextUseCase = Depends(
        Provide[Container.analyze_by_text_use_case]
    ),
) -> AnalysisResultSchema:
    result = await use_case.execute(payload.ingredients)
    return AnalysisResultSchema.from_domain(result)


@router.post("/by-ingredients-image", response_model=AnalysisResultSchema)
@inject
async def analyze_by_ingredients_image(
    image: UploadFile = File(..., description="전성분 라벨 이미지"),
    use_case: AnalyzeByIngredientsImageUseCase = Depends(
        Provide[Container.analyze_by_image_use_case]
    ),
    settings: Settings = Depends(Provide[Container.settings]),
) -> AnalysisResultSchema:
    content_type = image.content_type or ""
    if not content_type.startswith("image/"):
        received = content_type or "알 수 없음"
        raise ProblemException(
            status=415,
            title="지원하지 않는 이미지 형식",
            detail=f"이미지 파일만 업로드할 수 있습니다 (받은 형식: {received}).",
        )

    # 이미지는 메모리에서만 처리하고 디스크에 저장하지 않는다 (PDD §9, §13).
    data = await image.read()
    if len(data) > settings.max_upload_bytes:
        raise ProblemException(
            status=413,
            title="이미지 용량 초과",
            detail=f"이미지 크기가 허용 한도({settings.max_upload_bytes} bytes)를 초과했습니다.",
        )

    result = await use_case.execute(data)
    return AnalysisResultSchema.from_domain(result)
