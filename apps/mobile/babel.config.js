// NativeWind v4 + Expo Router 용 Babel 설정.
// jsxImportSource: 'nativewind' 로 className prop 을 스타일로 컴파일한다.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
