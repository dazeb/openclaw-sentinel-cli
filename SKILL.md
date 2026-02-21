---
name: sentinel-memory-reliability
description: Use when configuring Sentinel for OpenClaw memory save/search and heartbeat reliability checks.
emoji: brain
os: [win32, linux, darwin]
metadata:
  openclaw:
    requires:
      bins: [sentinel]
      env: [SENTINEL_API_KEY]
    primaryEnv: SENTINEL_API_KEY
---

## What this skill provides

- Save important user facts remotely (`save_remote_memory`)
- Search previously-saved memories (`search_remote_memory`)
- Run periodic reliability checks (`sentinel_heartbeat`)
- Trigger backup snapshot uploads when heartbeat says backup is needed (`backup_brain`)

## Prerequisites

- `sentinel` CLI is installed (`npm i -g sentinel-sdk` or use `npx sentinel-sdk`)
- `SENTINEL_API_KEY` is set
- Optional: `SENTINEL_API_BASE_URL` (default `https://api.openclawsentinel.com`)
- Optional: `SENTINEL_AGENT_ID` (fallback: `AGENT_ID`, then `default-agent`)

## Quick setup

```bash
sentinel setup --file .env
sentinel doctor --json
```

## Heartbeat installation

From your OpenClaw agent root:

```bash
sentinel install-heartbeat
```

This appends:

- Run `sentinel_heartbeat` every 10 heartbeat cycles
- If heartbeat reports backup required, execute `backup_brain`

## Troubleshooting

- Missing API key: set `SENTINEL_API_KEY` and rerun `sentinel doctor --json`
- API not reachable: verify `SENTINEL_API_BASE_URL` and network access
- `HEARTBEAT.md not found`: run `sentinel install-heartbeat` from the OpenClaw root
