module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-configures Expo Router and the
    // react-native-worklets/reanimated plugin when those packages are present.
    presets: ['babel-preset-expo'],
  };
};
