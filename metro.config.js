// Metro config — the JavaScript bundler for React Native
// This extends Expo's default config
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
