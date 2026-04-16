const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so Metro picks up changes in packages/*.
config.watchFolders = [workspaceRoot];

// Resolve modules from both the example app and the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Avoid duplicate React/RN/Reanimated copies that pnpm symlinks can introduce.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
