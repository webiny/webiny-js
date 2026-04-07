---
name: preflight
description: "Webiny-only. Run all checks required before packages are ready for publish: deps, build, lint, format, tests."
---

# Preflight

Webiny-only skill. Run all checks required before packages are ready for publish.

## Important

- Run steps in order.
- If any step fails, diagnose and fix the issue, then restart from step 1.
- Never run tests in parallel. Run each package sequentially.
- Before running tests for each package, count active test cases and shard at 32 tests per shard.
- To count active tests: `rg "^\s*(it|test|it\.each|test\.each)\s*\(" packages/<name>/__tests__ -t ts --count-matches | awk -F: '{s+=$2} END {print s}'`
- Calculate shards: `shards = ceil(count / 32)`. If shards is 1, no `--shard` flag needed.
- Suppress noisy output: redirect stdout to `/dev/null` or pipe through `tail` as needed.

## Steps

### 1. Install dependencies

```bash
yarn > /dev/null 2>&1
```

### 2. Sync dependency versions

```bash
yarn webiny sync-dependencies
```

Verify `packages/cli/files/duplicates.json` is an empty array (`[]`). If it contains entries, there are duplicate dependency versions that must be resolved before continuing.

### 3. Regenerate tsconfig files

```bash
node scripts/generateTsConfigsInPackages.js
```

### 4. Check package node_modules

```bash
node scripts/checkPackageNodeModules.js
```

### 5. Verify package.json dependencies match source imports

```bash
yarn adio
```

Must output "All dependencies in order!" to pass.

### 6. Format code

```bash
yarn prettier:fix > /dev/null 2>&1
```

This auto-fixes formatting issues. No manual intervention needed.

### 7. Lint

```bash
yarn eslint
```

This only checks — it does not auto-fix. If eslint reports errors, fix them manually, then restart from step 1.

### 8. Full clean build

```bash
yarn build --no-cache 2>&1 | tail -10
```

### 9. Check dist paths

```bash
node scripts/checkDistPaths.js
```

Verifies no `src/` paths remain in built output.

### 10. Run DDB tests

Run `yarn test` for each package below, sequentially. Count active tests first and shard at 32.

**Packages that need `yarn test`:**

- `api`
- `api-aco`
- `api-audit-logs`
- `api-core`
- `api-file-manager`
- `api-file-manager-aco`
- `api-headless-cms`
- `api-headless-cms-aco`
- `api-headless-cms-bulk-actions`
- `api-headless-cms-ddb`
- `api-headless-cms-import-export`
- `api-headless-cms-scheduler`
- `api-headless-cms-tasks`
- `api-headless-cms-workflows`
- `api-mailer`
- `api-record-locking`
- `api-scheduler`
- `api-sync-system`
- `api-website-builder`
- `api-website-builder-scheduler`
- `api-websockets`
- `api-workflows`
- `app-admin`
- `cognito`
- `db-dynamodb`
- `form`
- `handler`
- `handler-aws`
- `handler-graphql`
- `lexical-converter`
- `plugins`
- `react-composition`
- `react-properties`
- `react-rich-text-lexical-renderer`
- `tasks`
- `utils`

```bash
# 1. Count active tests
count=$(rg "^\s*(it|test|it\.each|test\.each)\s*\(" packages/<name>/__tests__ -t ts --count-matches | awk -F: '{s+=$2} END {print s}')
shards=$(( (count + 31) / 32 ))

# 2a. If shards <= 1, run without sharding
yarn test packages/<name> 2>&1 | grep "Test Files"

# 2b. If shards > 1, run each shard sequentially
yarn test packages/<name> --shard=1/$shards 2>&1 | grep "Test Files"
yarn test packages/<name> --shard=2/$shards 2>&1 | grep "Test Files"
# ... etc
```

### 11. Run OpenSearch tests

Run `yarn test:os` for each package below, sequentially. Count active tests first and shard at 32.

**Packages that need BOTH `yarn test` (step 10) AND `yarn test:os`:**

- `api-aco`
- `api-audit-logs`
- `api-file-manager`
- `api-file-manager-aco`
- `api-headless-cms`
- `api-headless-cms-aco`
- `api-headless-cms-bulk-actions`
- `api-headless-cms-import-export`
- `api-mailer`
- `api-scheduler`
- `api-workflows`
- `tasks`

**Packages that need ONLY `yarn test:os` (not in step 10):**

- `api-dynamodb-to-elasticsearch`
- `api-elasticsearch-tasks`
- `api-headless-cms-ddb-es`
- `api-headless-cms-es-tasks`
- `api-opensearch`

```bash
yarn test:os packages/<name> 2>&1 | grep "Test Files"
```

### 12. Check for uncommitted changes

```bash
git status
```

Report any unexpected uncommitted changes from the steps above.

## Keeping the package lists up to date

If the lists seem stale, re-derive them:

```bash
# All testable packages (have vitest.config.ts)
find packages -maxdepth 2 -name "vitest.config.ts" | sed 's|packages/||;s|/vitest.config.ts||' | sort

# Packages with ddb-os support
grep -rl "ddb-os" --include="ci.config.json" packages/ | sed 's|packages/||;s|/ci.config.json||' | sort

# Check if a package has standalone ddb tests too
grep -o '"ddb"' packages/<name>/ci.config.json
```
