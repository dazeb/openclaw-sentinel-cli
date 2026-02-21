#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { SentinelClient } from '../client.js';
import { resolveWorkspaceDir } from '../workspace.js';

const program = new Command();

dotenv.config();

const DEFAULT_BASE_URL = 'https://api.openclawsentinel.com';
const DEFAULT_AGENT_ID = 'default-agent';

const SECRETS_DEFERRED_MESSAGE =
  'Secrets sync over Sentinel Gateway HTTP is deferred in this release. Use local Convex secret sync workflow instead.';

type RuntimeConfig = {
  apiKey?: string;
  baseUrl: string;
  agentId: string;
};

type RuntimeOptions = {
  apiKey?: string;
  baseUrl?: string;
  agentId?: string;
};

function resolveRuntimeConfig(options: RuntimeOptions = {}): RuntimeConfig {
  const apiKey = options.apiKey ?? process.env.SENTINEL_API_KEY;
  const baseUrl = options.baseUrl ?? process.env.SENTINEL_API_BASE_URL ?? DEFAULT_BASE_URL;
  const agentId =
    options.agentId ?? process.env.SENTINEL_AGENT_ID ?? process.env.AGENT_ID ?? DEFAULT_AGENT_ID;

  return { apiKey, baseUrl, agentId };
}

function parseEnvFileKeys(filePath: string): Set<string> {
  if (!fs.existsSync(filePath)) return new Set<string>();
  const existing = fs.readFileSync(filePath, 'utf-8');
  const keys = new Set<string>();
  for (const line of existing.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const key = trimmed.slice(0, trimmed.indexOf('=')).trim();
    if (key) keys.add(key);
  }
  return keys;
}

function writeSetupTemplate(filePath: string, force: boolean): { written: boolean; detail: string } {
  const templateLines = [
    '# Sentinel CLI / OpenClaw plugin configuration',
    'SENTINEL_API_KEY=',
    `SENTINEL_API_BASE_URL=${DEFAULT_BASE_URL}`,
    `SENTINEL_AGENT_ID=${DEFAULT_AGENT_ID}`,
    '# AGENT_ID is supported for legacy compatibility',
    `AGENT_ID=${DEFAULT_AGENT_ID}`,
  ];

  if (!fs.existsSync(filePath) || force) {
    fs.writeFileSync(filePath, `${templateLines.join('\n')}\n`, 'utf-8');
    return {
      written: true,
      detail: force
        ? `Overwrote ${filePath} with Sentinel setup template.`
        : `Created ${filePath} with Sentinel setup template.`,
    };
  }

  const existing = fs.readFileSync(filePath, 'utf-8');
  const existingKeys = parseEnvFileKeys(filePath);
  const additions: string[] = [];

  const desired: Array<[string, string]> = [
    ['SENTINEL_API_KEY', ''],
    ['SENTINEL_API_BASE_URL', DEFAULT_BASE_URL],
    ['SENTINEL_AGENT_ID', DEFAULT_AGENT_ID],
    ['AGENT_ID', DEFAULT_AGENT_ID],
  ];

  for (const [key, value] of desired) {
    if (!existingKeys.has(key)) {
      additions.push(`${key}=${value}`);
    }
  }

  if (additions.length === 0) {
    return { written: false, detail: `${filePath} already contains Sentinel keys.` };
  }

  const next = `${existing.replace(/\s*$/, '')}\n\n# Added by sentinel setup\n${additions.join('\n')}\n`;
  fs.writeFileSync(filePath, next, 'utf-8');

  return { written: true, detail: `Appended ${additions.length} missing key(s) to ${filePath}.` };
}

const runEnvPush = async (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: No file found at ${filePath}.`);
    process.exit(1);
  }
  console.error(`ERROR: ${SECRETS_DEFERRED_MESSAGE}`);
  process.exit(1);
};

const runEnvPull = async (_filePath: string, _force: boolean) => {
  console.error(`ERROR: ${SECRETS_DEFERRED_MESSAGE}`);
  process.exit(1);
};

const warnDeprecatedAlias = (alias: string, canonical: string) => {
  console.warn(`[DEPRECATED] '${alias}' will be removed in v1.2.0. Use '${canonical}'.`);
};

program.name('sentinel').description('Sentinel Agent CLI Manager').version('1.1.0');

program
  .command('setup')
  .description('Prepare Sentinel environment variables for CLI + OpenClaw plugin usage')
  .option('--file <path>', 'Path to env file', '.env')
  .option('--force', 'Overwrite env file with Sentinel template')
  .option('--json', 'Emit machine-readable setup output')
  .action((options: { file: string; force?: boolean; json?: boolean }) => {
    const filePath = path.resolve(process.cwd(), options.file || '.env');
    const result = writeSetupTemplate(filePath, Boolean(options.force));
    const config = resolveRuntimeConfig();

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            file: filePath,
            ...result,
            requiredEnv: ['SENTINEL_API_KEY'],
            optionalEnv: ['SENTINEL_API_BASE_URL', 'SENTINEL_AGENT_ID', 'AGENT_ID'],
            detected: {
              hasApiKey: Boolean(config.apiKey),
              baseUrl: config.baseUrl,
              agentId: config.agentId,
            },
          },
          null,
          2
        )
      );
      return;
    }

    console.log(result.detail);
    console.log('Required env: SENTINEL_API_KEY');
    console.log('Optional env: SENTINEL_API_BASE_URL, SENTINEL_AGENT_ID (or AGENT_ID)');
    console.log(`Detected base URL: ${config.baseUrl}`);
    console.log(`Detected agent ID: ${config.agentId}`);
  });

program
  .command('doctor')
  .description('Checks Sentinel API key, connectivity, and agent configuration')
  .option('--json', 'Emit machine-readable JSON output')
  .option('--strict-warn', 'Treat WARN checks as failures')
  .option('--api-key <value>', 'Override API key for this command')
  .option('--base-url <url>', 'Override Sentinel API base URL for this command')
  .option('--agent-id <id>', 'Override agent ID for this command')
  .action(
    async (options: {
      json?: boolean;
      strictWarn?: boolean;
      apiKey?: string;
      baseUrl?: string;
      agentId?: string;
    }) => {
      const checks: Array<{ label: string; level: 'OK' | 'WARN' | 'FAIL'; detail: string }> = [];
      const { apiKey, baseUrl, agentId } = resolveRuntimeConfig(options);

      if (apiKey) {
        checks.push({
          label: 'API key',
          level: 'OK',
          detail: 'SENTINEL_API_KEY is set.',
        });
      } else {
        checks.push({
          label: 'API key',
          level: 'FAIL',
          detail: 'SENTINEL_API_KEY is missing.',
        });
      }

      if (process.env.SENTINEL_AGENT_ID || process.env.AGENT_ID || options.agentId) {
        checks.push({
          label: 'Agent ID',
          level: 'OK',
          detail: `Agent ID resolved as '${agentId}'.`,
        });
      } else {
        checks.push({
          label: 'Agent ID',
          level: 'WARN',
          detail: `No agent ID configured. Using fallback '${DEFAULT_AGENT_ID}'.`,
        });
      }

      if (apiKey) {
        try {
          const client = new SentinelClient({ apiKey, baseUrl, agentId });
          await client.query('health:get', {});
          checks.push({
            label: 'API reachability',
            level: 'OK',
            detail: `Connected to ${baseUrl} (GET /v1/health).`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          checks.push({
            label: 'API reachability',
            level: 'FAIL',
            detail: `${baseUrl} unreachable or rejected request: ${message}`,
          });
        }
      } else {
        checks.push({
          label: 'API reachability',
          level: 'FAIL',
          detail: 'Skipped because SENTINEL_API_KEY is missing.',
        });
      }

      const hasFail = checks.some((check) => check.level === 'FAIL');
      const hasWarn = checks.some((check) => check.level === 'WARN');
      const shouldFail = hasFail || Boolean(options.strictWarn && hasWarn);

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ok: !shouldFail,
              hasWarnings: hasWarn,
              strictWarn: Boolean(options.strictWarn),
              checks,
            },
            null,
            2
          )
        );
      } else {
        for (const check of checks) {
          console.log(`[${check.level}] ${check.label}: ${check.detail}`);
        }
      }

      if (shouldFail) {
        process.exit(1);
      }
    }
  );

program
  .command('check')
  .description('Fast connectivity check (equivalent to: sentinel doctor --strict-warn)')
  .option('--json', 'Emit machine-readable JSON output')
  .option('--api-key <value>', 'Override API key for this command')
  .option('--base-url <url>', 'Override Sentinel API base URL for this command')
  .option('--agent-id <id>', 'Override agent ID for this command')
  .action(
    async (options: { json?: boolean; apiKey?: string; baseUrl?: string; agentId?: string }) => {
      const { apiKey, baseUrl, agentId } = resolveRuntimeConfig(options);
      const checks: Array<{ label: string; level: 'OK' | 'FAIL'; detail: string }> = [];

      if (!apiKey) {
        checks.push({
          label: 'API key',
          level: 'FAIL',
          detail: 'SENTINEL_API_KEY is missing.',
        });
      } else {
        checks.push({
          label: 'API key',
          level: 'OK',
          detail: 'SENTINEL_API_KEY is set.',
        });
      }

      if (apiKey) {
        try {
          const client = new SentinelClient({ apiKey, baseUrl, agentId });
          await client.query('health:get', {});
          checks.push({
            label: 'API health',
            level: 'OK',
            detail: `Connected to ${baseUrl}.`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          checks.push({
            label: 'API health',
            level: 'FAIL',
            detail: message,
          });
        }
      }

      const ok = checks.every((entry) => entry.level === 'OK');

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ok,
              checks,
              agentId,
              baseUrl,
            },
            null,
            2
          )
        );
      } else {
        for (const check of checks) {
          console.log(`[${check.level}] ${check.label}: ${check.detail}`);
        }
      }

      if (!ok) {
        process.exit(1);
      }
    }
  );

program
  .command('env')
  .description('Environment secret sync commands')
  .addCommand(
    new Command('push')
      .description('Backup local .env secrets to the Cloud Vault')
      .option('--file <path>', 'Path to env file', '.env')
      .action(async (options: { file: string }) => {
        const filePath = path.resolve(process.cwd(), options.file || '.env');
        await runEnvPush(filePath);
      })
  )
  .addCommand(
    new Command('pull')
      .description('Restore secrets from Cloud Vault to local .env')
      .option('--file <path>', 'Path to env file', '.env')
      .option('--force', 'Overwrite destination file without prompt')
      .action(async (options: { file: string; force?: boolean }) => {
        const filePath = path.resolve(process.cwd(), options.file || '.env');
        await runEnvPull(filePath, Boolean(options.force));
      })
  );

program
  .command('env-push')
  .description("Deprecated alias for 'sentinel env push'")
  .option('--file <path>', 'Path to env file', '.env')
  .action(async (options: { file: string }) => {
    warnDeprecatedAlias('sentinel env-push', 'sentinel env push');
    const filePath = path.resolve(process.cwd(), options.file || '.env');
    await runEnvPush(filePath);
  });

program
  .command('env-pull')
  .description("Deprecated alias for 'sentinel env pull'")
  .option('--file <path>', 'Path to env file', '.env')
  .option('--force', 'Overwrite destination file without prompt')
  .action(async (options: { file: string; force?: boolean }) => {
    warnDeprecatedAlias('sentinel env-pull', 'sentinel env pull');
    const filePath = path.resolve(process.cwd(), options.file || '.env');
    await runEnvPull(filePath, Boolean(options.force));
  });

program
  .command('install-heartbeat')
  .description('Injects Sentinel protocols into OpenClaw HEARTBEAT.md')
  .option(
    '--workspace-dir <path>',
    'OpenClaw workspace root (defaults: --workspace-dir, OPENCLAW_WORKSPACE_DIR, then current directory)'
  )
  .action((options: { workspaceDir?: string }) => {
    const workspaceDir = resolveWorkspaceDir({ workspaceDir: options.workspaceDir });
    const heartbeatPath = path.join(workspaceDir, 'HEARTBEAT.md');

    if (!fs.existsSync(heartbeatPath)) {
      console.error('ERROR: HEARTBEAT.md not found. Are you in the root of an OpenClaw agent?');
      process.exit(1);
    }

    const sentinelBlock = `

Every 10 cycles, you MUST perform a "System Health Check" by executing the \`sentinel_heartbeat\` tool.
If the tool reports "Backup Required", immediately execute \`backup_brain\`.
`;

    const content = fs.readFileSync(heartbeatPath, 'utf-8');
    if (content.includes('sentinel_heartbeat')) {
      console.log('Sentinel heartbeat block is already installed in HEARTBEAT.md');
      return;
    }

    fs.appendFileSync(heartbeatPath, sentinelBlock);
    console.log('Successfully injected Sentinel heartbeat block into HEARTBEAT.md');
  });

program.parse(process.argv);
