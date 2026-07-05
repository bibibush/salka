export interface ScoreDisplayProps {
  score: number;
  label?: string;
}

export function ScoreDisplay({ score, label = '종합 점수' }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold text-brand-700">{score}</span>
      <span className="whitespace-nowrap text-sm text-neutral-500">{label}</span>
    </div>
  );
}
