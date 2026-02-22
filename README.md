# openclaw-sentinel-cli

Published Sentinel package for OpenClaw agents to save/search memory at **openclawsentinel.com** and keep memory sync reliable.

npm: https://www.npmjs.com/package/openclaw-sentinel-cli

[![Socket Badge](https://badge.socket.dev/npm/package/openclaw-sentinel-cli/1.1.0)](https://badge.socket.dev/npm/package/openclaw-sentinel-cli/1.1.0)

pkg:npm/openclaw-sentinel-cli@1.1.0

Includes in one npm package:

- OpenClaw plugin manifest (`openclaw.plugin.json`)
- OpenClaw runtime entrypoint (`dist/openclaw.js`)
- CLI (`sentinel`) with setup/doctor/check
- Agent skill docs (`SKILL.md`)

## Install

### Global CLI

```bash
npm i -g openclaw-sentinel-cli
```

### One-off via npx

```bash
npx openclaw-sentinel-cli doctor --json
```

### Local dependency

```bash
npm i openclaw-sentinel-cli
```

## Required config

You can configure via env vars **or** OpenClaw plugin config.

### Environment variables

| Variable | Required | Default |
|---|---|---|
| `SENTINEL_API_KEY` | Yes | none |
| `SENTINEL_API_BASE_URL` | No | `https://openclawsentinel.com` |
| `SENTINEL_AGENT_ID` | No | `default-agent` |
| `AGENT_ID` | No (legacy fallback) | `default-agent` |

Example:

```bash
export SENTINEL_API_KEY="sk_live_..."
export SENTINEL_API_BASE_URL="https://openclawsentinel.com"
export SENTINEL_AGENT_ID="my-openclaw-agent"
```

Or scaffold `.env`:

```bash
sentinel setup --file .env
```

## CLI quickstart

```bash
sentinel setup --file .env
sentinel doctor --json
sentinel check --json
```

### Commands

- `sentinel setup [--file .env] [--force] [--json]`
- `sentinel doctor [--json] [--strict-warn] [--api-key ...] [--base-url ...] [--agent-id ...]`
- `sentinel check [--json]` (fast API key + health check)
- `sentinel install-heartbeat`
- `sentinel env push|pull` (currently deferred with guidance output)

## OpenClaw plugin usage

1. Install package in your OpenClaw project:
   ```bash
   npm i openclaw-sentinel-cli
   ```
2. Ensure plugin artifacts are available from package:
   - `openclaw.plugin.json`
   - `dist/openclaw.js`
   - `SKILL.md`
3. Configure plugin (either env or plugin config):
   - `apiKey`
   - `baseUrl` (optional)
   - `agentId` (optional)
4. Reload OpenClaw plugins.

Registered tools:

- `save_remote_memory`
- `search_remote_memory`
- `backup_brain`
- `sentinel_heartbeat`

## Reliability behavior

- `save_remote_memory` persists user-critical facts to Sentinel cloud.
- `search_remote_memory` queries previously saved memory.
- `sentinel_heartbeat` checks gateway health + backup freshness + new memory signals.
- `backup_brain` uploads key identity files for recovery.

Install heartbeat policy into `HEARTBEAT.md`:

```bash
sentinel install-heartbeat
```

## Development

```bash
npm install
npm run build
npm pack
```
