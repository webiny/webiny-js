---
name: webiny-cms-bulk-actions
description: >
  Authoring a custom Headless CMS bulk action (EntriesBulkAction) that Webiny runs as a
  background task, plus the Admin-side button that triggers it. Use this skill when the
  developer wants to add a bulk action to the content-entry list (e.g. apply a discount,
  generate content, bulk-transform entries), understand loadData/processData, make the
  task converge, filter by custom fields, or trigger the action from the Admin UI.
  Requires Webiny 6.5.0 or newer.
---

# Custom Headless CMS bulk actions

## TL;DR

A bulk action is a class implementing `EntriesBulkAction.Interface` with two methods —
`loadData` (which entries) and `processData` (what to do to each). Register it with
`export default EntriesBulkAction.createImplementation({...})` via `<Api.Extension src>`.
For every registered bulk action, Webiny **automatically generates** a list background
task, a process background task, and a GraphQL mutation. On the Admin side, add a
`ContentEntryListConfig.Browser.BulkAction` button that calls `BulkActionFeature`'s
`useCase.execute({ model, action, where, data })`.

Available from **Webiny 6.5.0** (`webiny/api/cms/entry`).

## Backend — the bulk action

```typescript
// extensions/myBulkAction/api/MyBulkAction.ts
import {
  EntriesBulkAction,
  ListLatestEntriesUseCase,
  UpdateEntryUseCase
} from "webiny/api/cms/entry";

class MyBulkActionImpl implements EntriesBulkAction.Interface {
  // PascalCased into the task ids + GraphQL enum value, so "applyDiscount" →
  // tasks hcmsBulk(List|Process)ApplyDiscountEntries and frontend action "ApplyDiscount".
  readonly name = "applyDiscount";
  // Optional: restrict which models get the mutation/button.
  readonly modelIds = ["product"];
  // Optional: entries processed per batch (defaults to the configured batchSize).
  // readonly batchSize = 50;

  constructor(
    private listEntries: ListLatestEntriesUseCase.Interface,
    private updateEntry: UpdateEntryUseCase.Interface
  ) {}

  // Runs in the "list" task, with pagination (params.where/search/after/limit).
  async loadData(model, params) {
    const result = await this.listEntries.execute(model, params);
    return result.value; // { entries, meta }
  }

  // Runs in the "process" task, once per entry, in batches.
  async processData(model, params) {
    // params.id is a revision id ("<entryId>#0001"); params.data carries whatever the
    // Admin action sent.
    // ...update / transform the entry here...
  }
}

export default EntriesBulkAction.createImplementation({
  implementation: MyBulkActionImpl,
  dependencies: [ListLatestEntriesUseCase, UpdateEntryUseCase]
});
```

`loadData`/`processData` **are** the background-task body. You never write scheduling,
batching, retry, or timeout-resume code — the tasks system provides all of it. Webiny
generates `hcmsBulkList<Name>Entries`, `hcmsBulkProcess<Name>Entries`, and the mutation
`bulkAction<SingularApiName>(action: <Name>, ...)`.

## Convergence — the #1 gotcha

The engine calls `loadData` **repeatedly** until it returns zero entries — after each
processing round it re-lists to check for more work. **If `loadData` keeps returning the
same entries, the task never converges: it re-processes them until it hits `maxIterations`
and fails.** So the filter MUST exclude already-processed entries.

- **State-transition actions** converge naturally: Publish filters `status_not: "published"`
  and `processData` publishes; the next list is smaller. Built-in actions rely on this.
- **Actions with no natural "done" state** need a marker:
  - A boolean flag: `loadData` excludes `flag = true`; `processData` sets it. Simple, but
    blocks re-running until you reset the flag.
  - A **per-run token** (re-runnable): the Admin action generates a fresh `runId` per
    click and filters "not stamped with this run"; `processData` stamps the entry with
    `runId`. The run converges once everything is stamped, but the next click uses a new
    token, so the same entries are eligible again — no manual reset.

## Where filters — two layers, two formats

The bulk-action list path talks to storage **directly**, bypassing the GraphQL
where-transform. Mind the difference:

- **GraphQL where** (what the Admin action sends, typed as `<Model>ListWhereInput`):
  system fields are top-level (`id_in`, `status_not`, `savedOn_lt`, …); **custom fields
  are nested** under `values` — `where: { values: { onSale_not: true } }`. A dotted key
  like `"values.onSale_not"` is rejected by the typed input.
- **Storage where** (what `loadData` passes to the list use case): custom fields are
  **flat dotted** — `{ "values.onSale_not": true }`; system fields stay top-level. A bare
  `onSale_not` throws `There is no field with the fieldId "onSale"`.

So if the Admin action sends a custom-field filter, flatten it in `loadData`:

```typescript
async loadData(model, params) {
    const where = { ...params.where };
    if (where.values && typeof where.values === "object") {
        for (const [k, v] of Object.entries(where.values)) {
            where[`values.${k}`] = v;
        }
        delete where.values;
    }
    return (await this.listEntries.execute(model, { ...params, where })).value;
}
```

Alternatively, add a **constant** custom-field filter entirely in `loadData` (storage
format) and send only system fields from the Admin (that's how the simplest actions work).

Note: only **searchable** custom fields appear in the GraphQL where input; a plain field
may not be filterable via GraphQL, in which case add the filter backend-side in `loadData`.

## Updating entries from processData

Use `UpdateEntryUseCase`; field values are nested under `values`, and pass
`{ skipValidation: true }` for targeted, system-driven field updates so an unrelated
required/invalid field on the entry doesn't fail the operation:

```typescript
await this.updateEntry.execute(
  model,
  entry.id,
  { values: { price: newPrice } },
  { skipValidation: true }
);
```

To read the current entry inside `processData`, inject `GetLatestRevisionByEntryIdUseCase`
and call `execute(model, { id: params.id.split("#")[0] })`.

## Admin — the button

```tsx
// extensions/myBulkAction/admin/Extension.tsx
import { ContentEntryListConfig } from "webiny/admin/cms/entry/list";
const { Browser } = ContentEntryListConfig;
export default () => (
  <ContentEntryListConfig>
    <Browser.BulkAction name="applyDiscount" element={<MyActionButton />} modelIds={["product"]} />
  </ContentEntryListConfig>
);
```

```tsx
// The button. `name` (here on the config) matches the backend action name.
import { observer } from "mobx-react-lite";
import { BulkActionButton, useBulkActionDialog, useFeature } from "webiny/admin";
import { useModel } from "webiny/admin/cms";
import { BulkActionFeature, useContentEntriesPresenter } from "webiny/admin/cms/entry/list";

export const MyActionButton = observer(() => {
  const { model } = useModel();
  const presenter = useContentEntriesPresenter();
  const { showConfirmationDialog } = useBulkActionDialog();
  const { useCase: bulkAction } = useFeature(BulkActionFeature);

  const selection = presenter.list.vm.selection;
  const rows = presenter.list.vm.rows.filter(r => selection.selectedIds.has(r.id));

  const run = () =>
    showConfirmationDialog({
      title: "Apply discount",
      message: `Apply to ${selection.label}? Runs as a background task.`,
      execute: async () => {
        // System-field scope (id_in) is valid GraphQL; custom-field filters go under `values`.
        const where = selection.allSelected ? undefined : { id_in: rows.map(r => r.id) };
        await bulkAction.execute({ model, action: "ApplyDiscount", where, data: { percent: 10 } });
        presenter.list.actions.selection.deselectAll();
      }
    });

  return <BulkActionButton text="Apply -10%" tooltipContent="Apply discount" onClick={run} />;
});
```

The browser never loops over entries — `execute` fires the mutation and the work runs
server-side, in the background. Use `observer` (selection is MobX-observable). The bulk
confirmation dialog only takes strings; for richer input (e.g. a picker) use
`DropdownMenu`/`Select` from `webiny/admin/ui`.

## Real-time progress (optional)

`processData` can emit a websocket message per entry via `WebsocketsSendToIdentityUseCase`
(`webiny/api`) + `IdentityContext` (`webiny/api/security`); an admin `WebsocketEventHandler`
(`webiny/admin/websockets`) then toasts via `Notifications` (`webiny/admin`). See the
`webiny-websocket-notifications` skill.

## Reference

- Built-in actions live in `@webiny/api-headless-cms-bulk-actions` (Publish, Unpublish,
  Delete, Move, Restore) — good templates for `loadData`/`processData`.
- Successful list/process tasks are private and self-clean; failed ones persist (visible
  in the Background Tasks screen).
