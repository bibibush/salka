import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnalysisResultStore } from '@/entities/analysis';
import { Button } from '@/shared/ui';
import { AnalysisResultCard } from '@/widgets/analysis-result';

export function ResultPage() {
  const result = useAnalysisResultStore((state) => state.result);
  const router = useRouter();

  // 결과는 메모리 store 에만 보관되므로, 결과가 없으면(예: 앱 재시작) 입력 화면으로 되돌린다.
  if (!result) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-4 py-8">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-neutral-900">분석 결과</Text>
          <Button label="다시 분석하기" variant="ghost" onPress={() => router.replace('/')} />
        </View>

        <AnalysisResultCard result={result} />
      </ScrollView>
    </SafeAreaView>
  );
}
