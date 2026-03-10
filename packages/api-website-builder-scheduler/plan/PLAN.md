# Plan: Add Scheduler to api-website-builder

## Context
The `api-headless-cms` already has a scheduling extension (`api-headless-cms-scheduler`) that allows pages/entries to be published or unpublished at a future time. The Website Builder needs the same capability for its pages. This will be implemented as a new standalone package `api-website-builder-scheduler`, following the identical pattern.

## Approach
Create `packages/api-website-builder-scheduler` that:
1. Registers `SchedulePageAction` feature — schedules future publish/unpublish of WB pages
2. Registers `CancelScheduledPageAction` feature — cancels an existing schedule by ID
3. Registers `CancelScheduledActionOnPageChange` feature — auto-cancels scheduled actions when a user manually publishes, unpublishes, or deletes a page
4. Exposes a GraphQL schema extending `WbQuery` / `WbMutation`

**Namespace:** `Wb/Page` (no modelId variation — only one page model)
**Action types:** `"Publish"` | `"Unpublish"`
**Target ID:** page revision ID (e.g. `abc123#0001`)

---

## Files to Create

### Package root
- `packages/api-website-builder-scheduler/package.json`
- `packages/api-website-builder-scheduler/tsconfig.json` (copy structure from `api-headless-cms-scheduler`)

### `src/index.ts`
```ts
export const createWebsiteBuilderScheduler = (): PluginCollection => {
    return [createWebsiteBuilderScheduleContext(), createWbSchedulerGraphQL()];
};
```

### `src/context.ts`
Registers 3 features into `context.container`:
```ts
SchedulePageActionFeature.register(container);
CancelScheduledPageActionFeature.register(container);
CancelScheduledActionOnPageChangeFeature.register(container);
```

### Feature: `SchedulePageAction`
Files:
- `src/features/SchedulePageAction/abstractions.ts` — `SchedulePageActionUseCase` abstraction with input `{ id, immediately?, scheduleFor?, actionType: "Publish" | "Unpublish" }`
- `src/features/SchedulePageAction/SchedulePageActionUseCase.ts` — implementation using:
  - `ScheduleActionUseCase` + `RunActionUseCase` from `@webiny/api-scheduler`
  - `GetPageByIdUseCase` from `@webiny/api-website-builder` (to get title from `page.properties.title`)
  - Namespace: `Wb/Page`
- `src/features/SchedulePageAction/actionHandlers/PublishPageActionHandler.ts`
  - `canHandle(ns, type)`: `ns === "Wb/Page" && type === "Publish"`
  - `handle()`: calls `PublishPageUseCase.execute({ id: action.targetId })`
  - Dependencies: `PublishPageUseCase` from `@webiny/api-website-builder`
- `src/features/SchedulePageAction/actionHandlers/UnpublishPageActionHandler.ts`
  - Similar but calls `UnpublishPageUseCase`
- `src/features/SchedulePageAction/feature.ts` — `createFeature`, registers use case + 2 handlers
- `src/features/SchedulePageAction/index.ts` — re-exports

### Feature: `CancelScheduledPageAction`
Files:
- `src/features/CancelScheduledPageAction/abstractions.ts` — `CancelScheduledPageActionUseCase` abstraction
- `src/features/CancelScheduledPageAction/CancelScheduledPageActionUseCase.ts` — wraps `CancelScheduledActionUseCase` from `@webiny/api-scheduler`
- `src/features/CancelScheduledPageAction/feature.ts`
- `src/features/CancelScheduledPageAction/index.ts`

### Feature: `CancelScheduledActionOnPageChange`
Files:
- `src/features/CancelScheduledActionOnPageChange/CancelScheduledActionOnPublishEventHandler.ts`
  - Implements `PageAfterPublishHandler.Interface`
  - Lists scheduled "Publish" actions for namespace `Wb/Page` + targetId, cancels them
- `src/features/CancelScheduledActionOnPageChange/CancelScheduledActionOnUnpublishEventHandler.ts`
  - Implements `PageAfterUnpublishHandler.Interface`, cancels "Unpublish" actions
- `src/features/CancelScheduledActionOnPageChange/CancelScheduledActionOnDeleteEventHandler.ts`
  - Implements `PageAfterDeleteHandler.Interface`, cancels both "Publish" and "Unpublish" actions
- `src/features/CancelScheduledActionOnPageChange/feature.ts` — registers all 3 handlers

### GraphQL: `src/graphql/index.ts`
Uses `GraphQLSchemaPlugin` (not `CmsGraphQLSchemaPlugin`) extending `WbQuery`/`WbMutation`:
```graphql
enum WbScheduleRecordType { publish unpublish }
type WbScheduleRecord { id, targetId, scheduledBy, publishOn, unpublishOn, type, title }
extend type WbQuery {
    getWbSchedule(id: ID!): WbGetScheduleResponse!
    listWbSchedules(where: ..., sort: ..., limit: Int, after: String): WbListSchedulesResponse!
}
extend type WbMutation {
    createWbSchedule(id: ID!, immediately: Boolean, scheduleFor: DateTime, type: WbScheduleRecordType!): WbCreateScheduleResponse!
    updateWbSchedule(id: ID!, immediately: Boolean, scheduleFor: DateTime, type: WbScheduleRecordType!): WbUpdateScheduleResponse!
    cancelWbSchedule(id: ID!): WbCancelScheduleResponse!
}
```
Resolvers resolve from `context.container.resolve(SchedulePageActionUseCase)` etc.

### `src/graphql/schema.ts`
Zod validation schemas for each GraphQL input (follow `api-headless-cms-scheduler/src/graphql/schema.ts`).

---

## `package.json` Dependencies
```json
{
  "name": "@webiny/api-website-builder-scheduler",
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-website-builder": "0.0.0",
    "@webiny/api-scheduler": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler-graphql": "0.0.0",
    "@webiny/utils": "0.0.0",
    "zod": "^3.25.76"
  }
}
```

---

## Key Reuse / Reference Files
| Reference | Path |
|---|---|
| CMS Scheduler entry | `packages/api-headless-cms-scheduler/src/index.ts` |
| CMS Scheduler context | `packages/api-headless-cms-scheduler/src/context.ts` |
| ScheduleEntryAction feature | `packages/api-headless-cms-scheduler/src/features/ScheduleEntryAction/` |
| CancelScheduledEntryAction | `packages/api-headless-cms-scheduler/src/features/CancelScheduledEntryAction/` |
| CancelOnEntryChange feature | `packages/api-headless-cms-scheduler/src/features/CancelScheduledActionOnEntryChange/` |
| CMS Scheduler GraphQL | `packages/api-headless-cms-scheduler/src/graphql/index.ts` |
| WB page events | `packages/api-website-builder/src/features/pages/PublishPage/events.ts` |
| WB page event abstractions | `packages/api-website-builder/src/features/pages/PublishPage/abstractions.ts` |
| WB GraphQL base | `packages/api-website-builder/src/graphql/createGraphQL.ts` |
| WB pages GraphQL | `packages/api-website-builder/src/graphql/pages/pages.gql.ts` |
| Scheduler abstractions | `packages/api-scheduler/src/shared/abstractions.ts` |

---

## Tests

Pattern: mirror `api-headless-cms-scheduler/__tests__/` — integration tests using real DynamoDB storage.

### `__tests__/__mocks/context/`
- `plugins.ts` — `createHandlerCore` composing: `createApiCore`, `createTenancyAndSecurity`, `createSchedulerManifestPlugin`, `createHeadlessCmsContext`, `createWebsiteBuilder`, `createScheduler`, plus the scheduler mock client
- `useHandler.ts` — creates handler, fires with `{ headers: { "x-tenant": "root" } }`, returns `ApiCoreContext`
- `tenancySecurity.ts` + `helpers.ts` — reuse the same pattern as WB's existing `__tests__/utils/tenancySecurity.ts`

Other mocks:
- `__tests__/__mocks/scheduleClient.ts` — same `vi.fn()` mock as CMS scheduler
- `__tests__/__mocks/schedulerManifestPlugin.ts` — same DynamoDB PutCommand for the manifest record

### `__tests__/actionHandlers.test.ts`
Full integration test:
1. Create a page (via `CreatePageUseCase`)
2. Schedule it for publishing (`SchedulePageActionUseCase`)
3. Assert 1 scheduled action with correct title
4. Execute it (`ExecuteScheduledActionUseCase`)
5. Assert page status = `"published"` (via `GetPageByIdUseCase`)
6. Schedule for unpublishing, execute, assert status = `"unpublished"`

### `__tests__/cancelOnChange.test.ts`
1. Create + schedule a page for publish
2. Manually publish via `PublishPageUseCase`
3. Assert the scheduled action was auto-cancelled (list returns 0 items)

---

## Implementation Notes (deviations from original plan)

These issues were discovered during implementation and fixed before the build passed.

### 1. `PageNotFoundError` not exported from WB package
`PageNotFoundError` lives in `packages/api-website-builder/src/domain/page/errors.ts` (internal). External packages cannot import it directly. **Fix:** `ISchedulePageActionErrors.pageNotFound` replaced with `pageError: GetPageByIdUseCase.Error` (the union of all GetPageById errors, which is publicly exported).

### 2. `IResolveListCallableResponse.meta` type too narrow
Original plan used `meta: Record<string, unknown>`. The actual `CmsEntryMeta` returned by `listScheduledActions.execute()` has no index signature, making it incompatible. **Fix:** Changed to `meta: unknown`.

### 3. Sort argument type mismatch in `listWbSchedules`
`validated.data.sort` is `string[]` but `listActions.execute()` expects `CmsEntryListSort` (branded template literal types). **Fix:** Added `// @ts-expect-error` comment — sort values are already validated by the Zod schema.

### 4. `resolveList` should use `ListErrorResponse`, not `ErrorResponse`
The reference (`api-headless-cms-scheduler`) uses `ListErrorResponse` in the `resolveList` catch block to produce the correct list envelope on error. The initial implementation used plain `ErrorResponse`. **Fix:** Import and use `ListErrorResponse` from `@webiny/handler-graphql`.

### 5. Missing `isFail()` guards in cancel event handlers
All three `CancelScheduledActionOnPageChange` handlers called `actionsResult.value.items` without first checking `actionsResult.isFail()`. A transient DynamoDB error would cause a runtime crash inside an event handler. **Fix:** Added `if (actionsResult.isFail()) { return; }` guard before accessing `.value` in all three handlers.

### 6. Extra files generated
- `src/graphql/ActionMapper.ts` — maps `IScheduledAction` to the `WbScheduleRecord` GQL shape (equivalent to CMS scheduler's `ActionMapper.ts`)
- `src/graphql/dates.ts` — date parsing utilities used by the GraphQL resolvers

---

## Verification
1. Build the new package: `yarn build -p @webiny/api-website-builder-scheduler 2>&1 | tail -30`
2. Run tests: `yarn test packages/api-website-builder-scheduler 2>&1 | tail -50`
3. Register `createWebsiteBuilderScheduler()` in a local Webiny project alongside `createWebsiteBuilder()` and `createScheduler()`
4. Via GraphQL playground:
   - `mutation { websiteBuilder { createWbSchedule(id: "...", scheduleFor: "...", type: publish) { data { id } } } }`
   - `mutation { websiteBuilder { cancelWbSchedule(id: "...") { data } } }`
5. Verify cancel-on-change: manually publish a page that has a scheduled publish → scheduled action should be cancelled
