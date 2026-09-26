# @webiny/mcp

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/mcp` is a small CLI/library package that (a) runs a stdio Model Context Protocol server exposing Webiny's skill/agent documentation as tools (`get_started`, `list_webiny_skills`, `get_webiny_skill`, `list_webiny_agents`, `get_webiny_agent`), and (b) auto-configures MCP client integration (config file + hint file) for a fixed set of coding agents (Claude Code, Cursor, Cline, Copilot/VS Code, Kiro, OpenCode, Windsurf). It is a leaf package (no internal `@webiny/*` deps) with no test coverage at all; the code itself is straightforward and mostly correct, but has a couple of real inconsistencies (see Bugs) and a maintainability gap from three parallel re-implementations of "patch a JSON config file" logic. Other packages that need to write/patch an agent's MCP JSON config or a markdown hint file should reuse `writeMcpConfig`/`writeHintFile` from `agents/shared.ts` rather than reimplementing them.

## Public API
Barrel (`src/index.ts`) exports: `startMcpServer`/`IMcpServerParams` (starts the stdio MCP server), `configureMcp`/`IConfigureMcpParams` (drives the `configure` CLI command), `discoverAgents`/`discoverPresets` (agent-adapter registry) plus `AgentPreset`/`AgentModule` types, and `IUi`/`ConsoleUi`.
Confirmed external consumer: `packages/create-webiny-project` imports `configureMcp`, `IUi`, and `discoverAgents` (e.g. `CreateWebinyProject.ts:9-10`, both `runInteractivePrompt.ts` files) to offer MCP setup during `create-webiny-project` onboarding — the only cross-package consumer found via codegraph. `discoverPresets` and `ConsoleUi` are only used internally (by `instructions.ts` and `ConfigureMcp.ts` respectively).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `packages/mcp/src/agents/instructions.ts:84` | The printed "Step 3: Verify the server starts" guidance says `npx @modelcontextprotocol/inspector npx webiny-mcp server`, but the CLI (`src/cli.ts:29-62`) only recognizes `serve` and `configure` as commands — `server` is not one of them. | A user who ran `webiny-mcp configure --instructions` and pastes the verification command verbatim gets `Usage: webiny-mcp <command>` and exit code 1 instead of a running inspector session. `printDone()` two lines away (`shared.ts:135`) correctly uses `serve`, confirming this is a typo rather than an alternate command. | high |
| 2 | medium | `packages/mcp/src/agents/copilot.ts:37` vs `shared.ts:33` and `opencode.ts:62` | `writeCopilotMcpConfig`'s registered entry is `{ command: "npx", args: ["webiny-mcp", "serve"] }` — it omits the `--additional-skills=./my-skills` argument that every other adapter (`claude`, `cursor`, `kiro`, `windsurf` via `shared.writeMcpConfig`, and `opencode` via its own writer) includes. | Running `webiny-mcp configure copilot` produces a working MCP entry, but any project-local skills placed in `./my-skills` (the convention the other five adapters wire up) are silently never passed to the server for Copilot/VS Code users — inconsistent behavior across otherwise-equivalent adapters with no comment explaining the intentional difference. | medium |

## Duplication
No clones flagged by jscpd (0 clones in `{JSCPD}/jscpd-mcp/jscpd-report.json` — differing config-shape strings across adapters keep token-level similarity below jscpd's threshold), but manual reading shows the same "read JSON, ensure a namespace key, skip if `webiny` entry exists, else write and report" logic implemented three separate times with only the top-level key and entry shape changed: `writeMcpConfig` (`shared.ts:28-55`, key `mcpServers`), `writeCopilotMcpConfig` (`copilot.ts:31-58`, key `servers`), and `writeOpenCodeMcpConfig` (`opencode.ts:59-89`, key `mcp`). These three could be one parameterized helper (namespace key + entry as params), which would also have prevented bug #2 above.

## Dead code
None found. Every barrel export has at least one consumer: `startMcpServer`/`configureMcp` are used by `cli.ts`, `discoverAgents`/`IUi`/`configureMcp` are used externally by `create-webiny-project`, `discoverPresets` is used by `instructions.ts`, and `ConsoleUi` is the default `IUi` in `ConfigureMcp.ts`.

## Convention issues
Minor "no inline types" violations (AGENTS.md/CLAUDE.md convention: extract inline object types to named interfaces): the local config-shape types in `shared.ts:35` (`{ mcpServers: Record<string, unknown> }`), `copilot.ts:38` (`{ servers: Record<string, unknown> }`), and `opencode.ts:66` (`{ $schema?: string; mcp: Record<string, unknown> }`) are all inline object type annotations on local variables rather than named interfaces. Low impact since these are private implementation details, not part of the public surface, but they'd naturally be unified if the duplication above is fixed (one named `McpConfigFile<K extends string>`-style interface instead of three inline ones).

## Test gaps
There are no test files anywhere in the package (`find packages/mcp -iname "*test*"` returns nothing), so none of the following are covered: `parseFlags` in `cli.ts` (repeated-flag-to-array handling, `--flag=value` parsing); the idempotency/parse-failure branches in `writeMcpConfig`/`writeHintFile`/`writeCopilotMcpConfig`/`writeOpenCodeMcpConfig` (what happens on malformed existing JSON, or when the `webiny` entry already exists); the MCP tool handlers in `McpServer.ts` (`get_webiny_skill`/`get_webiny_agent` not-found paths, catalog building with zero skills/agents); and `discoverAgents`/`discoverSkills` file-walking logic. Given `configureMcp` and `discoverAgents` are consumed by `create-webiny-project`'s interactive onboarding flow, regressions here would surface as broken first-run project setup.

## Recommendations
1. Fix the `server` → `serve` typo in `instructions.ts:84` (one-line fix, directly user-visible).
2. Consolidate `writeMcpConfig`, `writeCopilotMcpConfig`, and `writeOpenCodeMcpConfig` into a single parameterized helper in `shared.ts`, and while doing so decide whether Copilot's entry should also carry `--additional-skills=./my-skills` (bug #2) — right now it's the only adapter that doesn't.
3. Add a minimal test suite covering `parseFlags`, the config-writer idempotency/parse-error branches, and the MCP tool handlers' not-found paths, since this package currently has zero coverage despite being on the critical path for `create-webiny-project` onboarding.
