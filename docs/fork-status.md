# COS Workbench 5.1.4

COS Workbench is a Windows desktop fork of miuuyy/codex-chatgpt-web v5.0.6. It keeps native Codex in charge of tools, approvals and terminal sessions. The MIT license and upstream attribution remain intact.

## Implemented changes

- **Response ownership (5.1.4):** response selection and rebinding use the exact submitted user's outer DOM container. A historical staging acknowledgement that changes its DOM identity no longer counts as a second current response. The user anchor survives section virtualization. Multiple current candidates, a missing anchor, and a new user turn do not authorize choosing an arbitrary reply. Identity errors retain their specific message and non-retryable code through the browser helper and native adapter.
- **Follow-up tool attachment (5.1.3):** normal Full-mode turns open a fresh Temporary Chat, compile the complete native context, and select the exact connector before inserting the prompt. Installed 5.1.2 testing showed that a retained chat no longer exposes app selection or a personalization control. Waiting for those controls failed before submission. The launcher now replaces only the exact completed automatic tab; running turn ownership, manual chats, and explicit retained compaction handoffs keep their existing rules.
- **Native text receipts (5.1.2):** command and patch receipts also read exit codes from recognized native result headers. Parsing uses the start of the first text block and specific tool names. It does not scan arbitrary stdout or unrelated file content. Running sessions retain an unknown exit code.
- **Verification and blocker instructions (5.1.2):** the model must verify the artifact after its last edit and distinguish an observed error from an untested assumption. A blocker report must name the action, returned reason, and unfinished work. These are model instructions, not a guarantee that the model completes verification. Service refusals and required human actions remain enforced.
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

Normal Full-mode follow-ups send the complete native context instead of only the new suffix. This repeats context ingestion and can cost more time than retaining the browser chat. Multipart staging and explicit compaction handoffs keep their existing behavior. A retained checkpoint can still be inaccurate; this patch preserves its text, not its truth. Live browser drift, account features, approvals and service limits still apply.

## Validation — 5.1.4, Windows x64, 2026-09-15

The reported resume executed 15 native tool calls before response tracking failed with two new conversation identities. The previous adapter replaced that error with a general stopped-responding message. The regression test recreates the old staging reply and current reply changing identity together. An actual headless Chromium check also verifies the DOM scan, user-section virtualization, response rebinding, and final response text. This evidence covers that tracking defect; it does not establish that Temporary Chat expired.

| Check | Result |
| --- | --- |
| Complete core suite | 699 pass, 0 fail, 2 skip; 3,544 assertions |
| Launcher suite | 296 pass, 0 fail, 3 skip |
| Core TypeScript and version checks | Pass with Bun 1.4.0; app and launcher versions are 5.1.4 |
| Chromium response identity regression | Pass; historical and current replies remount while the submitted user section is virtualized |
| Installed multipart response | Pass on High and Pro; staging acknowledgement completes and the final response matches the exact requested text |
| Installed bundle integrity | All 6,002 manifest files match their SHA-256 hashes; installed manifest matches the packaged runtime |
| Installed runtime | 5.1.4 accepts turns after the update |

The release verification run also completed the renderer build, dependency audits, and relocated runtime smoke check. The subsequent review reran the full core and launcher suites, core TypeScript and version checks, the Chromium regression, and the installed multipart response checks. The original long-running tasks were not resumed. The installed native two-turn tool check remains the historical 5.1.3 evidence below; the 5.1.4 multipart check does not exercise native tools.

## Historical validation — 5.1.3, Windows x64, 2026-09-15

| Check | Result |
| --- | --- |
| Complete core suite | 697 pass, 0 fail, 2 skip; 3,538 assertions |
| Launcher suite | 296 pass, 0 fail, 3 skip |
| Follow-up attachment regression | Pass; exact completed automatic tab is replaced; required compaction tab is reused; native history and current tool token are preserved; failed selection prevents prompt insertion |
| Native text result receipts | Pass; zero and nonzero exits, running sessions, unrelated content, and duplicate acknowledgements |
| Final verification and blocker prompt contract | Pass |
| Core and renderer TypeScript checks | Pass |
| Core and launcher dependency audits | No known vulnerabilities reported |
| Version synchronization | 5.1.3 / Bun 1.4.0 |
| Relocated bundled runtime | `RELOCATABLE_RUNTIME_SMOKE_OK` against `launcher/build/runtime` |
| Windows NSIS package | `cos-workbench-5.1.3-win-x64.exe`; SHA-256 `d6e1f31544a4dd3e084b342b1b759527afecd41c1b9b5c74dfa63d2a0449bf85` |
| Live installed Codex follow-up check | Pass; Full-mode `chatgpt-web/pro`; first turn read `probe.txt`; follow-up recorded `exit 7` then the changed file; first-turn value preserved |
| Installed runtime | 5.1.3; sign-in, Bigger Context, and keep-running survived the update |
| Installed bundle integrity | Manifest validation passed; installed manifest, CLI, and browser helper hashes match the tested bundle |
| Installed connector verification | Pass; all ten checks passed, including native model routing, authenticated browser, runtime, tunnel, and connector discovery |
| Installed browser smoke | High returned `CODEX WEB GPT READY`; setup records now identify 5.1.3 as verified |

The native history from the two reported Pro tasks proves that tools executed on their initial turns. The NBA task's follow-up made no native calls. Browser diagnostics show one selected connector on the first turn and none on its follow-up. Version 5.1.2 tried to select the connector again in that retained chat. Its installed native test reproduced a personalization readiness timeout. Direct UI inspection confirmed that a fresh chat exposes the configured connector while the retained chat does not. Version 5.1.3 corrects the browser lifetime assumption instead of extending that timeout.

The game task stopped after a successful file edit. Its native record contains no matching safety rejection or tool-session termination. A refusal could have occurred upstream before forwarding. This patch improves evidence reporting and verification instructions; it does not establish the unknown cause of that stop or bypass a refusal. The original video and game tasks were not resumed by this patch.

The first acceptance attempt on 5.1.1 was blocked by a Windows broker pipe access error. After the user paused the active task, the packaged 5.1.2 upgrade succeeded through normal shutdown and restart. A real Pro native tool call then passed. The later retained-chat failure above was separate from that earlier pipe error. No pipe permissions changed. The 5.1.3 installer wrote version `5.1.3.0` before the originating Codex thread was aborted during reconnect. The installed app now accepts turns on 5.1.3. Keep-running was restored after that interrupted shutdown. The live Pro two-turn check then passed on the installed runtime.

The final setup review found a zero-size viewport on the home browser page. Reapplying the measured view bounds did not restore it. Maximizing and restoring the app window restored the viewport. Connector verification and the browser smoke then passed. This was a state recovery; no permanent viewport fix is claimed.

## Historical validation — 5.1.0/5.1.1, Windows x64, 2026-09-15

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

`cos-workbench-5.1.4-win-x64.exe`

SHA-256: `f67b38dd3a09e9c7506dfd8039171596fad6e2ed14a8d56b1f1f832db06003ad`

Build with the commands in [README](../README.md). The local executable and receipts stay out of the Git source tree. The updater accepts release assets only from `acct1cedric1/codex-chatgpt-web`; an unpublished stable release means no update is available.
