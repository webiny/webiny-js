# Plan 09: Build & Verify

**Depends on:** all previous plans
**Parallel with:** nothing — runs last

## Task

Run full build and verify nothing broke.

## Steps

1. Run monorepo scripts:
   ```bash
   # Update tsconfig files
   node scripts/generateTsConfigsInPackages.js

   # Sync dependencies
   yarn > /dev/null 2>&1
   yarn adio
   yarn webiny sync-dependencies

   # Format
   yarn format > /dev/null 2>&1

   # Lint
   yarn lint
   ```

2. Build affected packages in order:
   ```bash
   yarn build -p @webiny/api-opensearch 2>&1 | tail -30
   yarn build -p @webiny/api-opensearch-aws 2>&1 | tail -30
   yarn build -p @webiny/api-event-handler-aws-ddb-os 2>&1 | tail -30
   yarn build -p @webiny/webiny 2>&1 | tail -30
   ```

3. Full build (verify no transitive breakage):
   ```bash
   yarn build 2>&1 | tail -30
   ```

4. Run tests for affected packages:
   ```bash
   yarn test packages/api-opensearch 2>&1 | tail -50
   ```

## Success Criteria

- All builds pass (143/143 packages)
- No lint errors
- `api-opensearch` tests pass
- No other test regressions

## If Build Fails

- Check tsconfig references — new package may need to be referenced by consumers
- Check `package.json` exports field — paths must match actual file locations
- Check `yarn adio` output for dependency issues
