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

## Verification
1. Build the new package: `yarn build -p @webiny/api-website-builder-scheduler 2>&1 | tail -30`
2. Register `createWebsiteBuilderScheduler()` in a local Webiny project alongside `createWebsiteBuilder()` and `createScheduler()`
3. Via GraphQL playground:
   - `mutation { websiteBuilder { createWbSchedule(id: "...", scheduleFor: "...", type: publish) { data { id } } } }`
   - `mutation { websiteBuilder { cancelWbSchedule(id: "...") { data } } }`
4. Verify cancel-on-change: manually publish a page that has a scheduled publish → scheduled action should be cancelled
