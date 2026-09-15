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

## Connect local tools through MCP

1. In Workbench, open **MCP**. Create a separate OpenAI tunnel for your ChatGPT workspace and a regular API key with only **Tunnels Read + Use** permissions.
2. Under **Connect the local harness**, enter the tunnel ID and key. Click **Connect harness** and wait for the tunnel to become ready.
3. In ChatGPT, enable Developer mode and open **Plugins → Create app**. Use the exact name **Codex Native2**, choose **Tunnel**, select the Workbench tunnel, and select **No Auth**. Access is controlled by the tunnel and the active Codex turn capability.
4. Create and connect the app. In its permissions, select **Allow all actions**. This permits command and patch calls to reach the outer Codex harness, which still enforces its own approvals and sandbox.
5. Return to Workbench and click **Verify runtime**. All three setup steps must show completion.

Keep COS Workbench open. In Codex, select a **ChatGPT Web** model and start a normal task. Workbench attaches the connector automatically. Start with a read-only request, such as listing the project files. Available tools come from the active Codex task; this setup does not guarantee that every optional tool, including desktop control, is available.

The current installation routes normal OpenAI models through Workbench as well. Exiting Workbench can interrupt those models until the direct Codex route is restored. The separate legacy Chat On Steroids app is needed only for its own connectors and recording features.

Never commit tunnel IDs, runtime keys, browser sessions, or local configuration. MCP setup and connector discovery have been verified on Windows; a full native tool task remains a separate acceptance check.

## Task recovery

Open Activity to inspect recent task records. The store retains up to 200 turns and 64 tool receipts per turn. It records native task and turn IDs, tool names, explicit errors and observed exit codes. It stores no prompt, tool argument or output content. A stopped process marks incomplete calls as unknown. The recorded turn cannot silently restart; inspect native task history and the workspace, then send a new message. The recovery brief copies these instructions and receipt metadata. It never sends or executes them.

## Project

See [fork status](docs/fork-status.md), [architecture](docs/architecture.md), [troubleshooting](TROUBLESHOOTING.md), and the [MIT license](LICENSE).

Based on [miuuyy/codex-chatgpt-web](https://github.com/miuuyy/codex-chatgpt-web). Original copyright and third-party notices are preserved. This Windows fork has its own installer identity and update source. Other platforms remain unverified for this fork.
