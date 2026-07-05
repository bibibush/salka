import { Navigate, useNavigate } from 'react-router';

import { useAnalysisResultStore } from '@/entities/analysis';
import { Button } from '@/shared/ui';
import { AnalysisResultCard } from '@/widgets/analysis-result';

export function ResultPage() {
  const result = useAnalysisResultStore((state) => state.result);
  const navigate = useNavigate();

  // 결과는 메모리 store 에만 보관되므로, 결과가 없으면(예: 새로고침) 입력 화면으로 되돌린다.
  if (!result) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">분석 결과</h1>
        <Button variant="ghost" onClick={() => navigate('/')}>
          다시 분석하기
        </Button>
      </header>

      <AnalysisResultCard result={result} />
    </main>
  );
}
