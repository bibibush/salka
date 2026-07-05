// Jest 설정: jest-expo preset + @testing-library/react-native.
// RN/Expo/NativeWind 및 워크스페이스 패키지는 ESM 이 포함될 수 있어 transform 대상에 포함한다.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|ky|@cosmetics-analyzer/.*))',
  ],
};
