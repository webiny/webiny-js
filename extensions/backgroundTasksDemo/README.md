# Background Tasks Demo — "Apply Discount" bulk action

A minimal, video-ready demo showing the Webiny bulk-actions → background-tasks story.
One artifact spans all three posts.

## What's here

| File                                | Role                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `../models/ProductModel.ts`         | The demo CMS model (`product`, has a `price` number field).                                 |
| `../models/ProductCategoryModel.ts` | Referenced by Product; registered so the category picker isn't dangling.                    |
| `ApplyDiscountBulkAction.ts`        | **Backend.** A custom `EntriesBulkAction`. Webiny auto-generates a background task from it. |
| `ApplyDiscountAction.tsx`           | **Frontend.** The bulk-action button that triggers the task.                                |
| `index.tsx`                         | Registers the button into the Products content-entry list.                                  |

All registered in `webiny.config.tsx`.

## The key idea

A custom bulk action is **just two methods** — `loadData` and `processData`. You never
write scheduling, batching, retry, or timeout-resume code. For every registered
`EntriesBulkAction`, Webiny automatically generates:

- a **list** background task — `hcmsBulkListApplyDiscountEntries`
- a **process** background task — `hcmsBulkProcessApplyDiscountEntries`
- a GraphQL mutation — `bulkActionProduct(action: ApplyDiscount, ...)`

The action name `applyDiscount` is PascalCased into those ids/enum values, which is why
the frontend triggers it with `action: "ApplyDiscount"`.

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
