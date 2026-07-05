import { Text, View } from 'react-native';

export interface ScoreDisplayProps {
  score: number;
  label?: string;
}

export function ScoreDisplay({ score, label = '종합 점수' }: ScoreDisplayProps) {
  return (
    <View className="items-center">
      <Text className="text-3xl font-bold text-brand-700">{score}</Text>
      <Text className="text-sm text-neutral-500">{label}</Text>
    </View>
  );
}
