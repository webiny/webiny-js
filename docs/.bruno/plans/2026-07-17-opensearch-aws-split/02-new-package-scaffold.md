# Plan 02: New Package Scaffold

**Package:** `@webiny/api-opensearch-aws` (new)
**Location:** `packages/api-opensearch-aws/`
**Depends on:** nothing
**Parallel with:** 01-base-client-cleanup

## Task

Create the new package directory with `package.json`, `tsconfig.json`, and empty `src/index.ts`.

## Steps

1. Create `packages/api-opensearch-aws/` directory

2. Create `packages/api-opensearch-aws/package.json`:
   - Name: `@webiny/api-opensearch-aws`
   - Version: `0.0.0` (matches monorepo convention)
   - Main/types entries following existing package patterns
   - Dependencies:
     - `@opensearch-project/opensearch`: same version as in `api-opensearch/package.json`
     - `@webiny/api-opensearch`: `0.0.0`
     - `@webiny/error`: `0.0.0`
     - `@webiny/feature`: `0.0.0`
   - Copy structure from an existing small package like `api-opensearch` for reference
   - Include `exports` field with `./exports/api/opensearchAws.js` path

3. Create `packages/api-opensearch-aws/tsconfig.json`:
   - Extend base tsconfig
   - Reference `api-opensearch` as project reference
   - Use `~/` path alias for `src/`
   - Follow pattern from `packages/api-opensearch/tsconfig.json`

4. Create `packages/api-opensearch-aws/src/index.ts`:
   - Empty for now, will be filled in plan 05

5. Create directory structure:
   ```
   src/
   ├── index.ts
   ├── exports/
   │   └── api/
   └── features/
       └── AwsOpenSearchClientFactory/
   ```

## Verification

- Directory exists with correct structure
- `package.json` has correct dependencies
- `tsconfig.json` extends base and references api-opensearch
