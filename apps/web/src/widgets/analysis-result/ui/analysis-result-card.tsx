import type { AnalysisResult } from '@cosmetics-analyzer/api-client';

import { RECOMMENDATION_LABEL, ScoreDisplay, VerdictBadge } from '@/entities/analysis';

export interface AnalysisResultCardProps {
  result: AnalysisResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <VerdictBadge verdict={result.verdict} />
            <span className="text-sm text-neutral-500">{RECOMMENDATION_LABEL[result.recommendation]}</span>
          </div>
          <p className="text-lg text-neutral-800">{result.summary}</p>
        </div>
        <ScoreDisplay score={result.overall_score} />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-neutral-700">성분별 평가</h2>
        <ul className="flex flex-col gap-2">
          {result.assessments.map((item) => (
            <li
              key={item.ingredient}
              className="flex items-start justify-between gap-3 rounded-lg bg-neutral-50 p-3"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-neutral-800">{item.ingredient}</span>
                <span className="text-sm text-neutral-600">{item.reason}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <VerdictBadge verdict={item.verdict} />
                <span className="text-sm text-neutral-500">{item.score}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {result.cautions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-neutral-700">주의해서 확인할 성분</h2>
          <ul className="flex flex-col gap-2">
            {result.cautions.map((item) => (
              <li key={item.ingredient} className="rounded-lg bg-verdict-caution/10 p-3">
                <span className="font-medium text-neutral-800">{item.ingredient}</span>
                <p className="text-sm text-neutral-600">{item.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="rounded-lg bg-neutral-50 p-3">
        <p className="text-sm text-neutral-500">{result.disclaimer}</p>
      </footer>
    </article>
  );
}
