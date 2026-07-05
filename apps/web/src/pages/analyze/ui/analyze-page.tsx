import { useNavigate } from 'react-router';

import { AnalyzeForm } from '@/features/analyze-ingredients';

export function AnalyzePage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">화장품 성분 해석</h1>
        <p className="text-base text-neutral-600">
          전성분 텍스트나 이미지를 입력하면 참고용 성분 해석을 보여드립니다.
        </p>
      </header>

      <AnalyzeForm onAnalyzed={() => navigate('/result')} />

      <p className="text-sm text-neutral-400">
        본 도구는 공개된 성분 정보를 바탕으로 한 참고용 해석이며, 의학적 진단이나 안전성 보증이
        아닙니다.
      </p>
    </main>
  );
}
