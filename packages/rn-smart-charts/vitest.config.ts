import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/math/**/*.ts', 'src/normalize/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
