const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Web projesiyle ortak kod (../shared) Metro'nun izlediği klasörlere eklenir.
config.watchFolders = [path.resolve(__dirname, '../shared')]
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')]

module.exports = config
