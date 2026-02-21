import test from 'node:test';
import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { resolveWorkspaceDir } from './workspace.js';
test('resolveWorkspaceDir prefers explicit option over env and cwd', () => {
    const previousEnv = process.env.OPENCLAW_WORKSPACE_DIR;
    process.env.OPENCLAW_WORKSPACE_DIR = '/env/workspace';
    try {
        const resolved = resolveWorkspaceDir({ workspaceDir: '/explicit/workspace' });
        assert.equal(resolved, path.resolve('/explicit/workspace'));
    }
    finally {
        if (previousEnv === undefined) {
            delete process.env.OPENCLAW_WORKSPACE_DIR;
        }
        else {
            process.env.OPENCLAW_WORKSPACE_DIR = previousEnv;
        }
    }
});
test('resolveWorkspaceDir uses OPENCLAW_WORKSPACE_DIR when explicit option is absent', () => {
    const previousEnv = process.env.OPENCLAW_WORKSPACE_DIR;
    process.env.OPENCLAW_WORKSPACE_DIR = '/env/workspace';
    try {
        const resolved = resolveWorkspaceDir();
        assert.equal(resolved, path.resolve('/env/workspace'));
    }
    finally {
        if (previousEnv === undefined) {
            delete process.env.OPENCLAW_WORKSPACE_DIR;
        }
        else {
            process.env.OPENCLAW_WORKSPACE_DIR = previousEnv;
        }
    }
});
test('resolveWorkspaceDir falls back to process.cwd()', async () => {
    const previousEnv = process.env.OPENCLAW_WORKSPACE_DIR;
    delete process.env.OPENCLAW_WORKSPACE_DIR;
    const previousCwd = process.cwd();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sentinel-workspace-'));
    try {
        process.chdir(tempDir);
        const resolved = resolveWorkspaceDir();
        assert.equal(resolved, path.resolve(tempDir));
    }
    finally {
        process.chdir(previousCwd);
        await fs.rm(tempDir, { recursive: true, force: true });
        if (previousEnv === undefined) {
            delete process.env.OPENCLAW_WORKSPACE_DIR;
        }
        else {
            process.env.OPENCLAW_WORKSPACE_DIR = previousEnv;
        }
    }
});
//# sourceMappingURL=workspace.test.js.map