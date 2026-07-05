import { VERDICT_LABEL, verdictTone, type Verdict } from '../model/verdict';

export interface VerdictBadgeProps {
  verdict: Verdict;
}

const TONE_CLASS: Record<ReturnType<typeof verdictTone>, string> = {
  good: 'bg-verdict-good/10 text-verdict-good',
  caution: 'bg-verdict-caution/10 text-verdict-caution',
  bad: 'bg-verdict-bad/10 text-verdict-bad',
};

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const tone = verdictTone(verdict);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${TONE_CLASS[tone]}`}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
