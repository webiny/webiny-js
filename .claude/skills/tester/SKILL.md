---
name: tester
description: Use when running tests. Shows how to run tests for a single package, including OpenSearch (ddb-os) tests when applicable.
user_invocable: true
---

# Running Tests

## DDB-only tests (default)

```bash
yarn test packages/<package-name>
```

## OpenSearch (ddb-os) tests

```bash
yarn test:os packages/<package-name>
```

## Which command to use

Determine which commands to run based on the package. Source of truth: the `storageOps` key in each package's `ci.config.json`.

### Packages that need BOTH `yarn test` AND `yarn test:os`

These packages have `storageOps: ["ddb", "ddb-os,ddb"]`:

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
- `testing`

### Packages that need ONLY `yarn test:os` (no standalone ddb)

These packages have `storageOps: ["ddb-os,ddb"]` (no separate `"ddb"` entry):

- `api-dynamodb-to-elasticsearch`
- `api-elasticsearch-tasks`
- `api-headless-cms-ddb-es`
- `api-headless-cms-es-tasks`
- `api-opensearch`

### All other packages — `yarn test` only

If a package is not listed above, run only `yarn test`.

## Keeping this list up to date

If the list seems stale, re-derive it:

```bash
# Packages with ddb-os support
grep -rl "ddb-os" --include="ci.config.json" packages/ | sort

# Then check each file's storageOps to see if "ddb" is also present
```
