# Plan: app-website-builder-scheduler (Frontend)

## Context

The `api-website-builder-scheduler` package (already implemented) exposes WB-specific scheduling GraphQL
operations. This frontend package wires that API into the Website Builder admin UI, giving editors the
ability to schedule publish/unpublish for WB pages via 4 UI integration points.

This is a **standalone** package — it does **not** depend on or reuse `app-headless-cms-scheduler`'s
Scheduler component. It owns its own UI, gateways, domain models, and presenter, calling the WB-specific
GraphQL operations (`createWbSchedule`, `cancelWbSchedule`, `listWbSchedules`, `getWbSchedule`).

**Reference packages:**
- `packages/app-headless-cms-scheduler/` — architecture pattern to mirror
- `packages/app-headless-cms/src/admin/components/ContentEntries/Scheduler/` — how to build gateway adapters
- `packages/app-website-builder/src/admin/config/pages/PageListConfig.tsx` — extension points to wire into

---

## Package: `packages/app-website-builder-scheduler`

### `package.json`
```json
{
  "name": "@webiny/app-website-builder-scheduler",
  "dependencies": {
    "@webiny/app": "0.0.0",
    "@webiny/app-website-builder": "0.0.0",
    "@apollo/client": "^3.x",
    "mobx": "^6.x",
    "mobx-react-lite": "^3.x",
    "react": "^18.x",
    "@webiny/ui": "0.0.0",
    "@webiny/app-admin": "0.0.0",
    "zod": "^3.25.76"
  }
}
```

---

## File Structure

```
src/
  types.ts                            # ScheduleType enum + WbSchedulerEntry interface
  index.tsx                           # createWbScheduler() export

  Domain/
    Models/
      WbSchedulerItem/
        WbSchedulerItem.ts            # Immutable value object (mirrors SchedulerItem.ts)
        index.ts
    Repositories/
      WbSchedulerItems/               # items + meta state
      Search/                         # search query state
      SelectedItems/                  # selection state
      Sorting/                        # sort state

  Gateways/
    WbSchedulerGetGateway.ts          # Abstract interface
    WbSchedulerListGateway.ts         # Abstract interface
    WbSchedulerPublishGateway.ts      # Abstract interface
    WbSchedulerUnpublishGateway.ts    # Abstract interface
    WbSchedulerCancelGateway.ts       # Abstract interface
    index.ts

  adapters/                           # Apollo GraphQL implementations
    WbSchedulerGetGraphQLGateway.ts   # calls getWbSchedule
    WbSchedulerListGraphQLGateway.ts  # calls listWbSchedules
    WbSchedulerPublishGraphQLGateway.ts    # calls createWbSchedule(type: publish)
    WbSchedulerUnpublishGraphQLGateway.ts  # calls createWbSchedule(type: unpublish)
    WbSchedulerCancelGraphQLGateway.ts     # calls cancelWbSchedule
    graphql/
      fields.ts                       # WbScheduleRecord GQL fragment fields
    schema/
      wbSchedulerEntry.ts             # Zod schema to validate + transform API responses

  UseCases/                           # (mirror app-headless-cms-scheduler UseCases)
    ListItems/
    GetItem/
    PublishItem/
    UnpublishItem/
    CancelItem/
    SearchItems/
    SelectItems/
    SortItems/

  Presentation/
    WbScheduler/
      WbScheduler.tsx                 # Root component (observer, render prop API)
      WbSchedulerPresenter.ts         # MobX observable presenter + vm getter
      WbSchedulerControllers.ts       # Aggregator for controllers
      controllers/                    # Per-use-case controllers
      index.tsx
    components/
      Cells/
        CellTitle.tsx
        CellScheduledBy.tsx
        CellScheduledOn.tsx
        CellType.tsx
        CellActions.tsx
      Actions/
        CancelItem/
      Table/
      WbSchedulerOverlay/             # Full-screen overlay/drawer
      WbScheduleDialog/               # "Pick date" dialog
      SearchInput/
      Title/
    hooks/
      useWbScheduler.tsx              # Context hook
      useWbSchedulerItem.tsx
      useCancelWbSchedulerItem.tsx

  integration/                        # PageListConfig extension wiring
    PageSchedulerExtension.tsx        # Top-level component registered into PageListConfig
    ScheduleSidebarButton.tsx         # Sidebar.Footer button
    SchedulePageAction.tsx            # Row action menu item
    ScheduleBulkAction.tsx            # Bulk action
    ScheduleTableColumn.tsx           # Scheduled-for table column
```

---

## Types (`src/types.ts`)

```ts
export enum ScheduleType {
    publish = "publish",
    unpublish = "unpublish"
}

export interface WbSchedulerEntry {
    id: string;
    targetId: string;
    scheduledBy: { id: string; displayName: string; type: string };
    publishOn?: Date;
    unpublishOn?: Date;
    type: ScheduleType;
    title: string;
}
```

Note: No `model` field on `WbSchedulerEntry` — WB has only one page model, so `modelId` concept is
implicit. Gateway `execute()` params will have `modelId` in their shape (matching the gateway abstractions)
but implementations can ignore it or use a constant `PAGE_MODEL_ID = "page"`.

---

## Gateway Abstractions (`src/Gateways/`)

Mirror the `app-headless-cms-scheduler` gateway interfaces exactly (same param shapes), but scoped under
`Wb` names:

```ts
// WbSchedulerGetGateway.ts
export interface IWbSchedulerGetGateway {
    execute(params: { modelId: string; id: string }): Promise<WbSchedulerEntry | null>;
}

// WbSchedulerListGateway.ts
export interface IWbSchedulerListGateway {
    execute(params: {
        modelId: string;
        where?: {
            targetId?: string;
            title_contains?: string;
            type?: ScheduleType;
            scheduledBy?: string;
            scheduledFor?: Date;
            scheduledFor_gte?: Date;
            scheduledFor_lte?: Date;
        };
        sort?: ("scheduledFor_ASC" | "scheduledFor_DESC")[];
        limit?: number;
        after?: string;
    }): Promise<{ items: WbSchedulerEntry[]; meta: { cursor?: string; hasMoreItems: boolean; totalCount: number } }>;
}

// WbSchedulerPublishGateway.ts
export interface IWbSchedulerPublishGateway {
    execute(params: { modelId: string; id: string; scheduleOn: Date }): Promise<{ item: WbSchedulerEntry }>;
}

// WbSchedulerUnpublishGateway.ts  (same shape as Publish)

// WbSchedulerCancelGateway.ts
export interface IWbSchedulerCancelGateway {
    execute(params: { modelId: string; id: string }): Promise<void>;
}
```

---

## Apollo Gateway Implementations (`src/adapters/`)

Each class takes an `ApolloClient` in the constructor and calls the WB-specific GraphQL operations.

**GQL fields fragment** (`graphql/fields.ts`):
```graphql
fragment WbScheduleRecordFields on WbScheduleRecord {
    id
    targetId
    scheduledBy { id displayName type }
    publishOn
    unpublishOn
    type
    title
}
```

**`WbSchedulerGetGraphQLGateway`** — Calls `getWbSchedule(id: ID!)`:
```graphql
query GetWbSchedule($id: ID!) {
    websiteBuilder {
        getWbSchedule(id: $id) {
            data { ...WbScheduleRecordFields }
            error { code message }
        }
    }
}
```

**`WbSchedulerListGraphQLGateway`** — Calls `listWbSchedules`:
```graphql
query ListWbSchedules($where: WbListSchedulesWhereInput, $sort: [WbListSchedulesSorter!], $limit: Int, $after: String) {
    websiteBuilder {
        listWbSchedules(where: $where, sort: $sort, limit: $limit, after: $after) {
            data { ...WbScheduleRecordFields }
            meta { cursor hasMoreItems totalCount }
            error { code message }
        }
    }
}
```

**`WbSchedulerPublishGraphQLGateway`** — Calls `createWbSchedule(type: publish)`:
```graphql
mutation CreateWbSchedulePublish($id: ID!, $scheduleFor: DateTime!) {
    websiteBuilder {
        createWbSchedule(id: $id, scheduleFor: $scheduleFor, type: publish) {
            data { ...WbScheduleRecordFields }
            error { code message }
        }
    }
}
```

**`WbSchedulerUnpublishGraphQLGateway`** — Same mutation with `type: unpublish`.

**`WbSchedulerCancelGraphQLGateway`** — Calls `cancelWbSchedule(id: ID!)`:
```graphql
mutation CancelWbSchedule($id: ID!) {
    websiteBuilder {
        cancelWbSchedule(id: $id) {
            data
            error { code message }
        }
    }
}
```

All responses validated and transformed via Zod schema in `schema/wbSchedulerEntry.ts`.

---

## Presentation Layer

### `WbSchedulerPresenter.ts`
MobX observable class, owns all state via repositories. Exposes `vm` getter (same shape as
`SchedulerPresenter.vm` in `app-headless-cms-scheduler` but WB-typed).

### `WbScheduler.tsx` — Root component (render prop API)
```tsx
interface WbSchedulerProps {
    targetId: string;  // page revision ID
    render: (params: { showScheduler: () => void }) => React.ReactNode;
    // gateways are instantiated internally from Apollo client via useApolloClient()
}
```

Internally:
1. Calls `useApolloClient()` to get Apollo client.
2. Instantiates all 5 gateways.
3. Constructs repositories, presenter, and controllers.
4. Renders the overlay/dialog when `showScheduler()` is called via internal `useState`.

---

## PageListConfig Integration Points (4)

### 1. Row Action — `Browser.Page.Action`
File: `integration/SchedulePageAction.tsx`
- Menu item "Manage schedule" in the page row actions dropdown.
- Reads `page.id` (revision ID) from row context.
- Renders:
  ```tsx
  <WbScheduler
      targetId={page.id}
      render={({ showScheduler }) => (
          <MenuItem onClick={showScheduler}>Manage schedule</MenuItem>
      )}
  />
  ```

### 2. Sidebar Footer — `Browser.Sidebar.Footer`
File: `integration/ScheduleSidebarButton.tsx`
- Button "Manage schedule" in the right sidebar footer.
- Reads active page ID from sidebar context.
- Renders `<WbScheduler targetId={page.id} render={...} />`.

### 3. Table Column — `Browser.Table.Column`
File: `integration/ScheduleTableColumn.tsx`
- Adds "Scheduled" column to the page list table.
- Cell component `ScheduledForCell` fetches schedule via `getWbSchedule` for the row page ID, displays
  formatted date or "—".

### 4. Bulk Action — `Browser.BulkAction`
File: `integration/ScheduleBulkAction.tsx`
- Adds "Schedule for publishing" / "Schedule for unpublishing" bulk actions.
- Opens a date picker dialog; on confirm calls `createWbSchedule` for each selected page ID.
- Uses `useBulkAction()` hook from `@webiny/app-website-builder` to access selected pages.

### Top-level wiring — `PageSchedulerExtension.tsx`
Renders all 4 extensions in a single component:
```tsx
<PageListConfig>
    <PageListConfig.Browser.Page.Action name="schedule" element={<SchedulePageAction />} />
    <PageListConfig.Browser.Sidebar.Footer name="schedule" element={<ScheduleSidebarButton />} />
    <PageListConfig.Browser.Table.Column name="schedule" header="Scheduled" cell={<ScheduledForCell />} />
    <PageListConfig.Browser.BulkAction name="schedulePublish" element={<ScheduleBulkAction type="publish" />} />
    <PageListConfig.Browser.BulkAction name="scheduleUnpublish" element={<ScheduleBulkAction type="unpublish" />} />
</PageListConfig>
```

---

## Entry Point: `createWbScheduler()`

```ts
// src/index.tsx
export const createWbScheduler = () => {
    return [<PageSchedulerExtension key="wb-scheduler-extension" />];
};
```

Registered alongside `createWebsiteBuilder()`:
```ts
import { createWbScheduler } from "@webiny/app-website-builder-scheduler";

<Admin plugins={[createWebsiteBuilder(), createWbScheduler()]} />
```

---

## Key Reference Files
| Reference | Path |
|---|---|
| CMS Scheduler package structure | `packages/app-headless-cms-scheduler/src/` |
| CMS integration component | `packages/app-headless-cms/src/admin/components/ContentEntries/Scheduler/` |
| WB PageListConfig extension points | `packages/app-website-builder/src/admin/config/pages/PageListConfig.tsx` |
| CMS Scheduler gateway interfaces | `packages/app-headless-cms-scheduler/src/Gateways/` |
| CMS Scheduler domain model | `packages/app-headless-cms-scheduler/src/Domain/Models/SchedulerItem/` |
| CMS Scheduler presenter | `packages/app-headless-cms-scheduler/src/Presentation/Scheduler/SchedulerPresenter.ts` |
| CMS adapter pattern | `packages/app-headless-cms/src/admin/components/ContentEntries/Scheduler/adapters/` |
| WB page row action pattern | `packages/app-website-builder/src/admin/config/pages/` |

---

## Verification
1. Build: `yarn build -p @webiny/app-website-builder-scheduler 2>&1 | tail -30`
2. Register `createWbScheduler()` alongside `createWebsiteBuilder()` in admin app.
3. Open Website Builder → Pages list and verify:
   - "Manage schedule" item appears in row action menu.
   - "Manage schedule" button appears in sidebar footer.
   - "Scheduled" column appears in table.
   - Bulk actions are available when pages are selected.
4. Schedule a page for publish, verify scheduler overlay lists it.
5. Cancel the scheduled action from the overlay, verify it disappears.

---

## Implementation Notes (deviations from original plan)

_To be filled in post-implementation._
