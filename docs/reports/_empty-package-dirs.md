# Empty package directories under `packages/`

Verified with `ls -la packages/<dir>` and `git ls-files packages/<dir>`. All 10 directories below contain
only stale build output (`dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo`) — no `package.json`, no
`src/`, no other source or config files — and **none of them are tracked by git** (`git ls-files` returns
zero files for every one). They are leftovers from packages that were renamed/removed at the source level
but whose local build artifacts were never cleaned up; deleting them affects only the local filesystem, not
git history.

| Directory | Contents found | Tracked in git? |
|---|---|---|
| `api-event-handler-server-sql` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `api-event-handler-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `api-file-manager-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `api-headless-cms-bulk-actions-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `api-scheduler-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `api-websockets-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `background-tasks-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `cli-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `event-handler-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |
| `project-server` | `dist/`, `node_modules/`, `tsconfig.build.tsbuildinfo` | No (0 files) |

## Recommendation
Safe to delete from disk (`rm -rf packages/<dir>`) — none are referenced by git, so no history is lost.
No workspace/package.json in the repo can depend on them since they have no `package.json` of their own.
