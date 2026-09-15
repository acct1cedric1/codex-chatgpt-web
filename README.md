# COS Workbench

COS Workbench is our Windows desktop fork of codex-chatgpt-web. It connects a signed-in ChatGPT web session to native Codex task execution.

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

Version 5.1 adds cumulative checkpoint retention, durable tool receipts, restart review, a Windows broker fix, and direct setup without a social-link gate. The app uses its own data directory and icon. Codex still owns execution, approvals and terminal sessions.

The 5.1.1 update saves the browser session before confirming sign-in, shows installation separately from model-list verification, and explains how to retry a settings change when a Codex turn is active. The Windows install has passed sign-in, live browser, native model-list, Bigger Context, and same-version restart checks. MCP account setup is still required for local tools through ChatGPT.

This is an unofficial integration. It needs your own ChatGPT sign-in and available account features. Browser changes and service limits still apply. It does not bypass approvals or service refusals. A returned tool result does not prove a task succeeded.

## Local Windows build

Development requires Bun 1.4.0. Install Node.js and Git as well. The packaged app includes its own runtime.

```powershell
git clone https://github.com/acct1cedric1/codex-chatgpt-web.git
cd codex-chatgpt-web
git switch codex/cos-direction
bun install --frozen-lockfile
bun install --cwd launcher --frozen-lockfile
bun run --cwd launcher package:win
```

Run the generated installer in `launcher/artifacts`. Open COS Workbench. Choose English and Automatic interaction. Sign in through the app. Complete its connection test before installing the Codex route. Route installation changes native Codex configuration and can require a Codex restart. Keep the current app until this account passes a real task test.

## Task recovery

Open Activity to inspect recent task records. The store retains up to 200 turns and 64 tool receipts per turn. It records native task and turn IDs, tool names, explicit errors and observed exit codes. It stores no prompt, tool argument or output content. A stopped process marks incomplete calls as unknown. The recorded turn cannot silently restart; inspect native task history and the workspace, then send a new message. The recovery brief copies these instructions and receipt metadata. It never sends or executes them.

## Project

See [fork status](docs/fork-status.md), [architecture](docs/architecture.md), [troubleshooting](TROUBLESHOOTING.md), and the [MIT license](LICENSE).

Based on [miuuyy/codex-chatgpt-web](https://github.com/miuuyy/codex-chatgpt-web). Original copyright and third-party notices are preserved. This Windows fork has its own installer identity and update source. Other platforms remain unverified for this fork.
