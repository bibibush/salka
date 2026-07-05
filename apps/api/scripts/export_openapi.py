"""FastAPI 앱의 OpenAPI 스펙을 stdout(JSON)으로 출력한다.

api-client 패키지가 이 출력을 받아 openapi.json 으로 저장하고
openapi-typescript 로 TS 타입을 생성한다.

사용: uv run python -m scripts.export_openapi
"""

from __future__ import annotations

import json
import sys

from src.main import create_app


def main() -> None:
    app = create_app()
    json.dump(app.openapi(), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
