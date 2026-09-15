# COS Workbench 5.1.1

COS Workbench is a Windows desktop fork of miuuyy/codex-chatgpt-web v5.0.6. It keeps native Codex in charge of tools, approvals and terminal sessions. The MIT license and upstream attribution remain intact.

## Implemented changes

- **Cumulative checkpoints:** fallback compaction keeps recognized task checkpoints and the final compaction instruction. It removes other old entries in order and reports omitted history. Oversized protected context fails explicitly.
- **Task receipts:** the runtime commits task/turn identity and tool dispatch before emitting native calls. Results preserve explicit errors and integer exit codes. A generic result is called “returned,” never “successful.” No prompts, tool arguments or outputs enter this store.
- **Restart review:** a terminated runtime leaves incomplete calls unknown. Retained records fence automatic restart of the same recorded turn. A live HTTP reconnect reuses its runtime and accepts repeated matching result acknowledgements. Conflicting results fail.
- **Recovery UI:** Activity shows recent receipts and copies a recovery brief. The brief tells the user to inspect native history and the workspace before more changes. Copying it does not send instructions or execute tools.
- **Windows broker:** a bounded one-request/one-reply connection ends the client write side after a full response. Empty EOF fails promptly. This removes the reproduced named-pipe close deadlock.
- **Independent desktop identity:** COS Workbench has its own app ID, installer GUID, icon, browser partition, data folders and fork-only updater. Setup no longer requires visiting social pages.
- **Dependency fixes:** Hono is pinned to 4.13.5; launcher js-yaml is pinned to 4.3.2. Both audits report no known vulnerabilities at validation time.
- **Sign-in persistence:** version 5.1.1 flushes the owned Chromium session before it reports a new sign-in as complete. It also keeps the normal shutdown flush.
- **Setup feedback:** installation has its own completed state while native catalog verification remains separate. A busy runtime explains that the active Codex turn must finish or be cancelled before a settings change. It still refuses to stop an active turn.

## Ownership and limits

The managed runtime owns `runtime/task-records.json`. Its adapter instances share one store per file in that process. Receipts retain up to 200 turns and 64 recent tool entries per turn. Pending entries are not evicted within a turn. A full active-turn store fails instead of dropping an active record. These bounds also bound replay protection; this is not an unlimited audit log or a conversation backup.

The Activity reader exposes an allowlisted projection. It marks pending calls unknown when their recorded process is no longer present. The next runtime load also persists interrupted states. The recovery brief contains task IDs and tool names. It omits prompts, arguments and output. Native history remains the source for task instructions and full results.

An answer returned by the browser does not prove that a requested change is correct. Verification remains a separate task performed through native tools. This fork adds no second execution engine and no automatic mutation replay after a restart.

Normal turns and multipart compaction retain their existing context behavior. A retained checkpoint can still be inaccurate; this patch preserves its text, not its truth. Live browser drift, account features, approvals and service limits still apply.

## Validation — Windows x64, 2026-09-15

| Check | Result |
| --- | --- |
| Complete core suite | 697 pass, 0 fail, 2 skip |
| Launcher suite | 295 pass, 0 fail, 3 skip |
| Persisted native tool/result integration | Pass; dispatch and returned exit code survive; private argument/output absent |
| Persisted HTTP reconnect | Pass; one browser submission and one task record |
| Restart, task isolation, error receipts and conflicting result tests | Pass |
| Core and renderer TypeScript checks | Pass |
| Core and launcher dependency audits | No known vulnerabilities reported |
| Version synchronization | 5.1.1 / Bun 1.4.0 |
| Relocated bundled runtime | `RELOCATABLE_RUNTIME_SMOKE_OK` |
| Windows NSIS install | Installed under the current user |
| Installed app startup | 5.1.0 isolated packaged smoke passed; 5.1.1 installed and reopened with the managed runtime |
| Parent visual QA | PASS: onboarding, setup, empty records, review records, copy feedback; 1120px and 760px views |
| Renderer runtime checks | No page errors; compact view has no horizontal overflow |
| Native model catalog | Native Codex app-server lists all five ChatGPT Web models after removing the old router's fixed catalog override at the user's request |
| Authenticated browser smoke | High passed on the signed-in account |
| Workbench restart | Sign-in, integration, smoke-test result, and enabled Bigger Context survived a same-version 5.1.1 restart |
| Real account MCP setup | Pass; Full mode, private runtime key, healthy tunnel, and all three Workbench setup steps verified |
| ChatGPT connector discovery | Pass; Codex Native2 is connected, exposes six tool schemas, and has Allow all actions selected |
| Full native tool task through ChatGPT | Not yet verified end to end |

Two core skips and one launcher skip need Windows file-symlink permission. Regular-file rollback tests pass. The other launcher skips cover Linux-only behavior. The first installed smoke used the upstream 45-second process limit and timed out. An explicit installed-app run passed with a 120-second limit. The package test now allows that same limit for first-launch runtime copy and validation.

The 5.1.1 launcher suite passes 295 tests with the same three platform skips. This includes the session flush ordering and failed-flush checks, busy-turn refusal, and drain compensation. The renderer build and version checks pass.

Parent visual QA passes for the installed 5.1.1 Setup screen: all three completed checks are visible, no restart notice remains after catalog verification, and MCP is clearly separate. The installed main process, browser host, supervisor, preload, task-history reader, profile, and icon match the source files.

The installed program uses its own signed-in browser profile. No browser session or credentials were copied from another app. The supported setup installed the Workbench route. The old fixed catalog assignment was removed separately at the user's request. A fresh native Codex process loads the five Workbench models; already running Codex windows may still need a restart to refresh their picker. Workbench was launched through the Windows shell so its process is independent of the Codex task host.

MCP account setup is complete on the validated Windows installation. The runtime reports Full mode, the tunnel reports healthy and ready, and Workbench confirms that Codex Native2 is available. ChatGPT loaded all six MCP tool schemas. These checks prove setup and discovery, not successful execution of every tool. A full native tool task through ChatGPT remains unverified, so this build is not yet a verified replacement for every current COS workflow. macOS and Linux packaging remain unverified for this fork. Account credentials and local setup files remain outside Git.

## Windows artifact

`cos-workbench-5.1.1-win-x64.exe`

SHA-256: `578b23285ac10bd51c78f83f670ad898a4025e95349d8e2b788bd1e2db1b8d24`

Build with the commands in [README](../README.md). The local executable and receipts stay out of the Git source tree. The updater accepts release assets only from `acct1cedric1/codex-chatgpt-web`; an unpublished stable release means no update is available.
