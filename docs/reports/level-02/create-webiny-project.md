# @webiny/create-webiny-project

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`create-webiny-project` is the `npx create-webiny-project` bootstrap CLI: it validates the local
environment, scaffolds a new project from the `_templates/` folder (base + a hosting-specific
overlay for either the AWS/Pulumi stack or the ALPHA standalone/self-hosted stack), sets up a
vendored Yarn 4 binary and `.yarnrc.yml`, pins `@webiny/*` dependency versions to the CLI's own
version, installs packages, optionally configures an MCP server for the chosen AI agent (via
`@webiny/mcp`), reports telemetry (via `@webiny/telemetry`), and offers to run the first deploy.
The code is small, mostly imperative "one class per step" (`Ensure*`/`Get*`/`Setup*` services under
`src/services/`), reads cleanly, and correctly picked up the `EnsureSystemWebinyConfig` fix noted in
`global-config`'s report. Overall health is good; the one real functional bug is a mismatch between
the documented and actual value of the `--hosting-type` flag (see Bugs #1). Test coverage is
essentially limited to `SetupYarn`; nothing else in the package (including the whole
`CreateWebinyProject` orchestration and both hosting-type setup flows) has any automated tests.

## Public API

This package has no library consumers — it is a `bin` entrypoint only (`package.json` `"bin":
"./bin.js"`, dummy file; the real CLI is `src/bin.ts` → `dist/bin.js`). Nothing here is imported by
other `@webiny/*` packages (confirmed via codegraph: `CreateWebinyProject`, `SetupBaseWebinyProject`,
etc. have callers only within this package). Its only interesting outbound dependency behaviour is
that it is the sole cross-package consumer of `@webiny/mcp`'s `configureMcp`/`IUi`/`discoverAgents`
(per the `mcp` package report).

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | high | `src/bin.ts:65` vs `src/features/CreateWebinyProject.ts:103` | The `--hosting-type` option's own `--help` text documents the standalone value as `"server"` (`describe: 'Hosting type to use: "aws" (default) or "server" (standalone, ALPHA)...'`), but the code only ever treats the string `"standalone"` as standalone (`cliArgs.hostingType === "standalone" ? "standalone" : "aws"`); `runHostingTypePrompt.ts:3-13` (the interactive prompt) also only ever produces `"aws"`/`"standalone"`, never `"server"`. | A user or CI script running the CLI non-interactively (`--interactive=false --hosting-type server`) exactly as documented by `--help` silently gets a full AWS/Pulumi project instead of the standalone one they asked for, with no error or warning. | high |
| 2 | low | `src/services/SetupYarn.ts:47-54` | Comment says "Default settings are applied here. Currently, we only apply the `nodeLinker` param," but the code below it (`Object.assign(parsedYarnRc, exampleYarnRc)`) actually merges in all six keys from `_templates/base/example.yarnrc.yml` (`compressionLevel`, `enableScripts`, `npmMinimalAgeGate`, `approvedGitRepositories`, `npmPreapprovedPackages`), silently overriding the hard-coded `nodeLinker` default a few lines above if the template file's value ever diverges from `"node-modules"`. | Not currently harmful (the template's `nodeLinker` is also `"node-modules"`), but the stale comment misdescribes what changing `example.yarnrc.yml` will do, inviting a future edit that assumes only `nodeLinker` is templated. | medium |

## Duplication

- jscpd (`{JSCPD}/jscpd-create-webiny-project/jscpd-report.json`) reports one clone: `src/features/CreateWebinyProject/projects/aws/runInteractivePrompt.ts:20-35` (16 lines) is a near-verbatim duplicate of `src/features/CreateWebinyProject/projects/standalone/runInteractivePrompt.ts:19-34`. Both blocks call `discoverAgents()` and build the identical `agentChoices` array (map preset → `{value, name}` + append `"other"`). This logic, plus the `AiAgent = string | "other"` type declared separately in `projects/aws/types.ts:2` and `projects/standalone/types.ts:2`, is a good candidate for a shared `buildAiAgentChoices()` helper.
- No duplication of lower-level-dependency logic was found: the package correctly delegates to `@webiny/global-config`, `@webiny/system-requirements`, `@webiny/telemetry`, and `@webiny/mcp` rather than reimplementing their responsibilities.

## Dead code

- `renames` (`src/features/CreateWebinyProject/projects/base/SetupBaseWebinyProject.ts:8`) is exported but has no consumers outside its own file (codegraph: no cross-file callers). Low-impact; likely just should not be exported.

## Convention issues

- One class per file / DI naming conventions are followed consistently (`Ensure*`, `Get*`, `Setup*`, `Print*`, `Is*` classes each in their own file, class name matches file name).
- `src/features/CreateWebinyProject.ts:202-207` still has commented-out dead code (`// if (err instanceof GracefulError) { stage = "error-graceful"; }`) alongside a `const stage = "error"` that can now never be reassigned — harmless, but should either be finished or removed rather than left commented out.
- `package.json` lists `"os": "0.1.2"` as a runtime dependency (`packages/create-webiny-project/package.json`), but nothing in `src/` imports `os` — the only `import os from "os"` in the package is in the test file, which resolves to Node's built-in `os` module regardless of this dependency (Node core modules take precedence over `node_modules` of the same bare name). The dependency is inert but adds unnecessary supply-chain surface in a published, public package.

## Test gaps

- `__tests__/` contains exactly one test file (`SetupYarn.test.ts`, well-written with 6 cases). Everything else is untested: `CreateWebinyProject.execute` (the whole orchestration, including the analytics start/end/error tracking, cleanup-on-failure, and the standalone vs. AWS branch), `SetupAwsWebinyProject`/`SetupStandaloneWebinyProject` (including the `--template-options` JSON parsing and the `{REGION}` substitution), `SetupBaseWebinyProject` (file renames + `installationId` injection), and all the `Ensure*` guard services. In particular, the `--hosting-type` bug above (Bug #1) would have been caught by even a single non-interactive-mode unit test asserting the resolved hosting type for a given flag value.

## Recommendations

1. Fix the `--hosting-type` value/documentation mismatch (Bug #1): either accept `"server"` as an alias for standalone, or change the `--help` text to say `"standalone"`, and add a non-interactive-mode test pinning the expected mapping.
2. Extract the duplicated `discoverAgents()` → `agentChoices` block (and the duplicated `AiAgent` type) from the two `runInteractivePrompt.ts` files into one shared helper.
3. Add unit tests around `CreateWebinyProject.execute`'s control flow (success, install failure, cleanup on error) and the two `Setup*WebinyProject` classes, since this is the only untested entrypoint that both installs real dependencies and runs telemetry/MCP side effects for every new Webiny user.
