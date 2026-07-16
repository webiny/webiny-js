# Background Tasks Demo — "Apply Discount" bulk action

A minimal, video-ready demo showing the Webiny bulk-actions → background-tasks story.
One artifact spans all three posts.

## What's here

Organized by side (`api/` + `admin/`), with a full-stack entry component:

| File                                   | Role                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `BackgroundTasksDemo.tsx`              | **Entry.** Full-stack component — wires up the API and Admin extensions below.                                                         |
| `api/ApplyDiscountBulkAction.ts`       | **API.** A custom `EntriesBulkAction`. Webiny auto-generates a background task from it. Emits a websocket message per processed entry. |
| `admin/Extension.tsx`                  | **Admin entry.** Registers the bulk-action button + the websocket listener.                                                            |
| `admin/ApplyDiscountAction.tsx`        | **Admin.** The bulk-action button that triggers the task.                                                                              |
| `admin/DiscountAppliedEventHandler.ts` | **Admin.** Websocket listener that toasts when a discount is applied.                                                                  |
| `../models/ProductModel.ts`            | The demo CMS model (`product`, with `price` + `onSale`).                                                                               |
| `../models/ProductCategoryModel.ts`    | Referenced by Product; registered so the category picker isn't dangling.                                                               |

Registered in `webiny.config.tsx` as `<BackgroundTasksDemo />` (plus the two model
`<Api.Extension>` entries under `extensions/models/`).

## The key idea

A custom bulk action is **just two methods** — `loadData` and `processData`. You never
write scheduling, batching, retry, or timeout-resume code. For every registered
`EntriesBulkAction`, Webiny automatically generates:

- a **list** background task — `hcmsBulkListApplyDiscountEntries`
- a **process** background task — `hcmsBulkProcessApplyDiscountEntries`
- a GraphQL mutation — `bulkActionProduct(action: ApplyDiscount, ...)`

The action name `applyDiscount` is PascalCased into those ids/enum values, which is why
the frontend triggers it with `action: "ApplyDiscount"`.

### Convergence (important)

The tasks engine calls `loadData` **repeatedly** until it returns zero entries — after
each processing round it re-lists to check for more work. So `loadData` must exclude
entries it has already processed, or the task never finishes (it re-processes the same
entries until it hits `maxIterations` and fails). Built-in actions do this naturally
(e.g. Publish filters `status_not: "published"`).

This demo uses an `onSale` boolean on the Product model: `loadData` filters
`values.onSale_not: true`, and `processData` sets `onSale: true`. To re-run the discount
on a product, turn its **On sale** switch back off.

> Note the `values.` prefix in the filter. The bulk-action list path calls storage
> directly (bypassing the GraphQL where-transform), and at the storage layer custom
> fields live under `values.` while system fields (`id`, `status`, …) are top-level. A
> bare `onSale_not` throws `There is no field with the fieldId "onSale"`.

Flow:

```
[Admin UI]  select products → "Apply -10%" button
     │  worker.processInBulk({ action: "ApplyDiscount", where, data })
     ▼
[GraphQL]  bulkActionProduct mutation → context.tasks.trigger(...)
     ▼
[Background task]  list task paginates (loadData) → process task runs processData per entry
     ▼
[Result]  each product's price reduced by 10%, progress visible in the Background Tasks screen
```

## Real-time notification

Once a product is discounted, the backend sends a websocket message to the user who
triggered the action (`WebsocketsSendToIdentityUseCase`), and the admin toasts it:

```
[processData] → sendToIdentity({ action: "cms.product.discountApplied", data: { id, price, percent } })
     ▼
[DiscountAppliedEventHandler] (WebsocketEventHandler) → notifications.success(...)
```

Mirrors the File Manager AI-enrichment pattern. Fires per processed entry, so toasts pop
live as the background task works through the batch.

## Post mapping

1. **Bulk actions** — select products, hit "Apply -10%", prices update. Mention: this
   kicks off a background task (parts 2 & 3).
2. **Background tasks in code** — show `ApplyDiscountBulkAction.ts` (`loadData` /
   `processData` _are_ the task body) and `ApplyDiscountAction.tsx` (`processInBulk` =
   the trigger). Explain Webiny generates the task machinery.
3. **Background tasks interface** — show the run in the Background Tasks beta screen:
   status, batches, done/failed counts.

## Running it

```bash
yarn webiny watch api --env dev     # picks up the model + backend bulk action
yarn webiny watch admin --env dev   # picks up the button
```

Then in Admin: create a few Products (with prices), select them, click **Apply -10%**.

## Note — public API added in 6.5.0

Authoring a custom bulk action from a project needs API surface that wasn't public
before 6.5.0. Exposed via the `webiny` meta-package (each declared in the owning
package's `src/exports/**` folder, which the `generate-webiny-package` script merges):

- **API** — `EntriesBulkAction`, `EntriesBulkActionConfig` → `webiny/api/cms/bulk-actions`
- **Admin (trigger)** — `BulkActionFeature`, `BulkActionUseCase` → `webiny/admin/cms/entry/list`
- **Admin (UI)** — `BulkActionButton`, `useBulkActionDialog` → `webiny/admin`

`useModel`, `useContentEntriesPresenter`, and `useFeature` were already public.
