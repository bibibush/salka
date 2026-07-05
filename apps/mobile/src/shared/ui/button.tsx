import { Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
}

// RN 에서는 배경색은 Pressable, 글자색은 Text 에 적용한다.
const CONTAINER_CLASS: Record<Variant, string> = {
  primary: 'bg-brand-600',
  ghost: 'bg-transparent',
};

const LABEL_CLASS: Record<Variant, string> = {
  primary: 'text-neutral-0',
  ghost: 'text-brand-700',
};

export function Button({ label, variant = 'primary', disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`flex-row items-center justify-center rounded-lg px-4 py-3 ${
        CONTAINER_CLASS[variant]
      } ${disabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      <Text className={`text-base font-medium ${LABEL_CLASS[variant]}`}>{label}</Text>
    </Pressable>
  );
}
