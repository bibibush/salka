import { Text, View } from 'react-native';

import { VERDICT_LABEL, verdictTone, type VerdictTone, type Verdict } from '../model/verdict';

export interface VerdictBadgeProps {
  verdict: Verdict;
}

// RN 에서는 배경색은 View, 글자색은 Text 에 적용한다.
const CONTAINER_CLASS: Record<VerdictTone, string> = {
  good: 'bg-verdict-good/10',
  caution: 'bg-verdict-caution/10',
  bad: 'bg-verdict-bad/10',
};

const TEXT_CLASS: Record<VerdictTone, string> = {
  good: 'text-verdict-good',
  caution: 'text-verdict-caution',
  bad: 'text-verdict-bad',
};

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const tone = verdictTone(verdict);
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${CONTAINER_CLASS[tone]}`}>
      <Text className={`text-sm font-medium ${TEXT_CLASS[tone]}`}>{VERDICT_LABEL[verdict]}</Text>
    </View>
  );
}
