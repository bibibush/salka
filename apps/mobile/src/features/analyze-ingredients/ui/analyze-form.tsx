import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';

import { useAnalysisResultStore } from '@/entities/analysis';
import { Button } from '@/shared/ui';

import { useAnalyzeImage, useAnalyzeText, type PickedImage } from '../api/use-analyze';

export interface AnalyzeFormProps {
  /** 분석 성공 후 호출 (예: 결과 화면으로 이동) */
  onAnalyzed?: () => void;
}

type Mode = 'text' | 'image';

export function AnalyzeForm({ onAnalyzed }: AnalyzeFormProps) {
  const [mode, setMode] = useState<Mode>('text');
  const [ingredients, setIngredients] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const setResult = useAnalysisResultStore((state) => state.setResult);

  const analyzeText = useAnalyzeText();
  const analyzeImage = useAnalyzeImage();

  const submitText = async () => {
    const trimmed = ingredients.trim();
    if (!trimmed) {
      setTextError('전성분 텍스트를 입력해 주세요.');
      return;
    }
    setTextError(null);
    const result = await analyzeText.mutateAsync(trimmed);
    setResult(result);
    onAnalyzed?.();
  };

  const pickImage = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || picked.assets.length === 0) return;
    const asset = picked.assets[0];
    if (!asset) return;
    setImage({
      uri: asset.uri,
      name: asset.fileName ?? 'ingredients.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  const submitImage = async () => {
    if (!image) return;
    const result = await analyzeImage.mutateAsync(image);
    setResult(result);
    onAnalyzed?.();
  };

  const pending = analyzeText.isPending || analyzeImage.isPending;
  const failed = analyzeText.isError || analyzeImage.isError;

  return (
    <View className="flex-col gap-4">
      <View accessibilityRole="tablist" className="flex-row gap-2">
        <Button
          label="텍스트 입력"
          variant={mode === 'text' ? 'primary' : 'ghost'}
          accessibilityState={{ selected: mode === 'text' }}
          onPress={() => setMode('text')}
        />
        <Button
          label="이미지 입력"
          variant={mode === 'image' ? 'primary' : 'ghost'}
          accessibilityState={{ selected: mode === 'image' }}
          onPress={() => setMode('image')}
        />
      </View>

      {mode === 'text' ? (
        <View className="flex-col gap-3">
          <Text className="text-sm font-medium text-neutral-700">전성분 텍스트</Text>
          <TextInput
            accessibilityLabel="전성분 텍스트"
            multiline
            numberOfLines={5}
            placeholder="예: Water, Niacinamide, Glycerin ..."
            className="rounded-lg border border-neutral-300 p-3 text-base"
            value={ingredients}
            onChangeText={setIngredients}
          />
          {textError && (
            <Text accessibilityRole="alert" className="text-sm text-verdict-bad">
              {textError}
            </Text>
          )}
          <Button label={pending ? '분석 중…' : '분석하기'} disabled={pending} onPress={submitText} />
        </View>
      ) : (
        <View className="flex-col gap-3">
          <Text className="text-sm font-medium text-neutral-700">전성분 이미지</Text>
          {image && (
            <Image
              accessibilityLabel="선택한 전성분 이미지"
              source={{ uri: image.uri }}
              className="h-48 w-full rounded-lg"
              resizeMode="cover"
            />
          )}
          <Button label={image ? '다른 이미지 선택' : '이미지 선택'} variant="ghost" onPress={pickImage} />
          <Button
            label={pending ? '분석 중…' : '분석하기'}
            disabled={pending || !image}
            onPress={submitImage}
          />
        </View>
      )}

      {failed && (
        <Text accessibilityRole="alert" className="text-sm text-verdict-bad">
          분석에 실패했습니다. 잠시 후 다시 시도해 주세요.
        </Text>
      )}
    </View>
  );
}
