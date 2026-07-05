import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyzeForm } from '@/features/analyze-ingredients';

export function AnalyzePage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <ScrollView contentContainerClassName="gap-6 px-4 py-8">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-neutral-900">화장품 성분 해석</Text>
          <Text className="text-base text-neutral-600">
            전성분 텍스트나 이미지를 입력하면 참고용 성분 해석을 보여드립니다.
          </Text>
        </View>

        <AnalyzeForm onAnalyzed={() => router.push('/result')} />

        <Text className="text-sm text-neutral-400">
          본 도구는 공개된 성분 정보를 바탕으로 한 참고용 해석이며, 의학적 진단이나 안전성 보증이
          아닙니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
