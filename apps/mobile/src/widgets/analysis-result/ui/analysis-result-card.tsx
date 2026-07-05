import type { AnalysisResult } from '@cosmetics-analyzer/api-client';
import { Text, View } from 'react-native';

import { RECOMMENDATION_LABEL, ScoreDisplay, VerdictBadge } from '@/entities/analysis';

export interface AnalysisResultCardProps {
  result: AnalysisResult;
}

export function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  return (
    <View className="flex-col gap-6 rounded-2xl border border-neutral-200 bg-neutral-0 p-6">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 flex-col gap-2">
          <View className="flex-row items-center gap-2">
            <VerdictBadge verdict={result.verdict} />
            <Text className="text-sm text-neutral-500">
              {RECOMMENDATION_LABEL[result.recommendation]}
            </Text>
          </View>
          <Text className="text-lg text-neutral-800">{result.summary}</Text>
        </View>
        <ScoreDisplay score={result.overall_score} />
      </View>

      <View className="flex-col gap-3">
        <Text className="text-base font-semibold text-neutral-700">성분별 평가</Text>
        <View className="flex-col gap-2">
          {result.assessments.map((item) => (
            <View
              key={item.ingredient}
              className="flex-row items-start justify-between gap-3 rounded-lg bg-neutral-50 p-3"
            >
              <View className="flex-1 flex-col gap-1">
                <Text className="font-medium text-neutral-800">{item.ingredient}</Text>
                <Text className="text-sm text-neutral-600">{item.reason}</Text>
              </View>
              <View className="flex-row shrink-0 items-center gap-2">
                <VerdictBadge verdict={item.verdict} />
                <Text className="text-sm text-neutral-500">{item.score}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {result.cautions.length > 0 && (
        <View className="flex-col gap-3">
          <Text className="text-base font-semibold text-neutral-700">주의해서 확인할 성분</Text>
          <View className="flex-col gap-2">
            {result.cautions.map((item) => (
              <View key={item.ingredient} className="rounded-lg bg-verdict-caution/10 p-3">
                <Text className="font-medium text-neutral-800">{item.ingredient}</Text>
                <Text className="text-sm text-neutral-600">{item.reason}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="rounded-lg bg-neutral-50 p-3">
        <Text className="text-sm text-neutral-500">{result.disclaimer}</Text>
      </View>
    </View>
  );
}
