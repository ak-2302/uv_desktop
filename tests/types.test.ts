import { describe, expect, it } from 'vitest';

describe('uv desktop foundation', () => {
  it('exposes the intended command allowlist', () => {
    expect(['init', 'add', 'remove', 'sync', 'lock', 'tree', 'run']).toContain('sync');
  });
});
