import test from 'node:test';
import assert from 'node:assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { createBackupSkill } from './backupBrain.js';

const REQUIRED_FILES = ['IDENTITY.md', 'AGENTS.md', 'SOUL.md', 'TOOLS.md', 'USER.md'];

class FakeSentinelClient {
  public calls: Array<{ name: string; payload: unknown }> = [];

  async mutate(name: string, payload: unknown): Promise<void> {
    this.calls.push({ name, payload });
  }
}

async function writeRequiredFiles(workspaceDir: string, omit: string[] = []): Promise<void> {
  for (const fileName of REQUIRED_FILES) {
    if (omit.includes(fileName)) continue;
    await fs.writeFile(path.join(workspaceDir, fileName), `content for ${fileName}\n`, 'utf-8');
  }
}

test('backup_brain reads required files from configured workspace even when cwd is a subfolder', async () => {
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sentinel-backup-workspace-'));
  const nestedDir = path.join(workspaceDir, 'projects', 'nested');
  await fs.mkdir(nestedDir, { recursive: true });
  await writeRequiredFiles(workspaceDir);

  const previousCwd = process.cwd();
  process.chdir(nestedDir);

  try {
    const sentinel = new FakeSentinelClient();
    const skill = createBackupSkill(sentinel as never, { workspaceDir });
    const result = await skill.execute({ trigger: 'manual' });

    assert.match(result, /Backup successful\. Uploaded 5 files \(manual\)\./);
    assert.equal(sentinel.calls.length, 1);
    assert.equal(sentinel.calls[0]?.name, 'backups:create');

    const payload = sentinel.calls[0]?.payload as {
      files: Array<{ name: string; content: string; size: string }>;
    };

    assert.equal(payload.files.length, 5);
    assert.deepEqual(
      payload.files.map((file) => file.name).sort(),
      [...REQUIRED_FILES].sort()
    );
  } finally {
    process.chdir(previousCwd);
    await fs.rm(workspaceDir, { recursive: true, force: true });
  }
});

test('backup_brain skips upload when required files are missing in resolved workspace', async () => {
  const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sentinel-backup-missing-'));
  await writeRequiredFiles(workspaceDir, ['USER.md']);

  try {
    const sentinel = new FakeSentinelClient();
    const skill = createBackupSkill(sentinel as never, { workspaceDir });
    const result = await skill.execute({ trigger: 'scheduled' });

    assert.equal(result, 'Backup skipped. Missing required files: USER.md.');
    assert.equal(sentinel.calls.length, 0);
  } finally {
    await fs.rm(workspaceDir, { recursive: true, force: true });
  }
});
