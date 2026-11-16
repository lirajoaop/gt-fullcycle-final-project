import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // server.ts only wires the pieces together and opens the port; the logic it
      // starts (config, app, repositories) is covered by the tests.
      exclude: ['src/server.ts'],
      reporter: ['text', 'html', 'lcov'],
      // Minimum declared in the README. `npm run test:coverage` fails below it.
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
});
