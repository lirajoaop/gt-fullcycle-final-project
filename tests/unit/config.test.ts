import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';

describe('loadConfig', () => {
  it('uses defaults when nothing is set', () => {
    expect(loadConfig({})).toEqual({ PORT: 3000, LOG_LEVEL: 'info' });
  });

  it('reads and converts the environment variables', () => {
    const config = loadConfig({
      PORT: '8080',
      LOG_LEVEL: 'debug',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/pedidos',
    });

    expect(config).toEqual({
      PORT: 8080,
      LOG_LEVEL: 'debug',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/pedidos',
    });
  });

  it('fails listing every invalid variable', () => {
    expect(() => loadConfig({ PORT: 'abc', LOG_LEVEL: 'loud', DATABASE_URL: 'mysql://db' })).toThrow(
      /Invalid configuration: PORT: .*; LOG_LEVEL: .*; DATABASE_URL: /,
    );
  });
});
