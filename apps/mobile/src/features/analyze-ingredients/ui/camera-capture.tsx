import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/shared/ui';

import type { PickedImage } from '../api/use-analyze';

export interface CameraCaptureProps {
  /** 촬영 사진을 업로드용 이미지로 변환해 전달한다. */
  onCapture: (image: PickedImage) => void;
  /** 분석 진행 중 등 촬영을 막아야 할 때. */
  disabled?: boolean;
}

/**
 * 카메라 라이브 프리뷰(히어로) + 셔터. 전성분 표시면을 촬영해 분석에 사용한다.
 * 권한이 없으면 프리뷰 대신 권한 요청 UI 를 보여준다.
 */
export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);

  const takePicture = async () => {
    if (capturing || disabled) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;
      onCapture({ uri: photo.uri, name: 'ingredients.jpg', type: 'image/jpeg' });
    } finally {
      setCapturing(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 rounded-2xl bg-neutral-100 p-6">
        <Text className="text-center text-base text-neutral-700">
          전성분 표시면을 촬영하려면 카메라 접근 권한이 필요합니다.
        </Text>
        <Button label="카메라 권한 허용" onPress={requestPermission} />
      </View>
    );
  }

  const busy = capturing || disabled;

  return (
    <View className="flex-1 gap-4">
      <View
        testID="camera-view"
        className="flex-1 overflow-hidden rounded-2xl bg-neutral-900"
      >
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      </View>

      <View className="items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="촬영"
          accessibilityState={{ disabled: !!busy }}
          disabled={busy}
          onPress={takePicture}
          className={`h-20 w-20 items-center justify-center rounded-full border-4 border-brand-600 bg-neutral-0 ${
            busy ? 'opacity-50' : ''
          }`}
        >
          <View className="h-14 w-14 rounded-full bg-brand-600" />
        </Pressable>
        <Text className="mt-2 text-sm text-neutral-500">
          {busy ? '분석 중…' : '전성분 표시면을 촬영하세요'}
        </Text>
      </View>
    </View>
  );
}
