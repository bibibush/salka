import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyzeForm } from '@/features/analyze-ingredients';

export function AnalyzePage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <View className="flex-1 gap-4 px-4 py-6">
        <View className="gap-1">
          <Text className="text-2xl font-bold text-neutral-900">화장품 성분 해석</Text>
          <Text className="text-base text-neutral-600">
            전성분 표시면을 촬영하면 참고용 성분 해석을 보여드립니다.
          </Text>
        </View>

        <AnalyzeForm onAnalyzed={() => router.push('/result')} />

        <Text className="text-xs text-neutral-400">
          본 도구는 공개된 성분 정보를 바탕으로 한 참고용 해석이며, 의학적 진단이나 안전성 보증이
          아닙니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
