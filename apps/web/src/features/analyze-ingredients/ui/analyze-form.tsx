import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAnalysisResultStore } from '@/entities/analysis';
import { Button } from '@/shared/ui';

import { useAnalyzeImage, useAnalyzeText } from '../api/use-analyze';

export interface AnalyzeFormProps {
  /** 분석 성공 후 호출 (예: 결과 화면으로 이동) */
  onAnalyzed?: () => void;
}

type Mode = 'text' | 'image';

const textSchema = z.object({
  ingredients: z.string().trim().min(1, '전성분 텍스트를 입력해 주세요.'),
});
type TextForm = z.infer<typeof textSchema>;

export function AnalyzeForm({ onAnalyzed }: AnalyzeFormProps) {
  const [mode, setMode] = useState<Mode>('text');
  const [image, setImage] = useState<File | null>(null);
  const setResult = useAnalysisResultStore((state) => state.setResult);

  const analyzeText = useAnalyzeText();
  const analyzeImage = useAnalyzeImage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextForm>({
    resolver: zodResolver(textSchema),
    defaultValues: { ingredients: '' },
  });

  const submitText = handleSubmit(async ({ ingredients }) => {
    const result = await analyzeText.mutateAsync(ingredients);
    setResult(result);
    onAnalyzed?.();
  });

  const submitImage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!image) return;
    const result = await analyzeImage.mutateAsync(image);
    setResult(result);
    onAnalyzed?.();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.files?.[0] ?? null);
  };

  const pending = analyzeText.isPending || analyzeImage.isPending;
  const failed = analyzeText.isError || analyzeImage.isError;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="입력 방식" className="flex gap-2">
        <Button
          role="tab"
          aria-selected={mode === 'text'}
          variant={mode === 'text' ? 'primary' : 'ghost'}
          onClick={() => setMode('text')}
        >
          텍스트 입력
        </Button>
        <Button
          role="tab"
          aria-selected={mode === 'image'}
          variant={mode === 'image' ? 'primary' : 'ghost'}
          onClick={() => setMode('image')}
        >
          이미지 입력
        </Button>
      </div>

      {mode === 'text' ? (
        <form aria-label="텍스트 성분 분석" className="flex flex-col gap-3" onSubmit={submitText}>
          <label htmlFor="ingredients" className="text-sm font-medium text-neutral-700">
            전성분 텍스트
          </label>
          <textarea
            id="ingredients"
            rows={5}
            placeholder="예: Water, Niacinamide, Glycerin ..."
            className="rounded-lg border border-neutral-300 p-3 text-base"
            {...register('ingredients')}
          />
          {errors.ingredients && (
            <p role="alert" className="text-sm text-verdict-bad">
              {errors.ingredients.message}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? '분석 중…' : '분석하기'}
          </Button>
        </form>
      ) : (
        <form aria-label="이미지 성분 분석" className="flex flex-col gap-3" onSubmit={submitImage}>
          <label htmlFor="image" className="text-sm font-medium text-neutral-700">
            전성분 이미지
          </label>
          <input id="image" type="file" accept="image/*" onChange={onFileChange} />
          <Button type="submit" disabled={pending || !image}>
            {pending ? '분석 중…' : '분석하기'}
          </Button>
        </form>
      )}

      {failed && (
        <p role="alert" className="text-sm text-verdict-bad">
          분석에 실패했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}
