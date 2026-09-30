# OpenSearch tool in Dev Tools

Idea notes, not a spec. Findings from a codebase survey, plus the decisions that need making before
anything gets designed properly.

## Goal

A tool in the Admin Dev Tools menu letting a permitted user, for indexes derived from our own system
models:

- delete an index
- create an index, if it does not exist
- run the reindexing background task, if the index exists

Only registered on OpenSearch deployments. New package with `api` and `admin` halves, modelled on
`@webiny/webhooks`.

## What already exists

Most of this is wiring, not new machinery.

### Index enumeration is already solved

`OpensearchTenantIndexFactory`
(`packages/api-elasticsearch-tasks/src/abstractions/OpensearchTenantIndexFactory.ts`) is exactly the
"indexes derived from our system models" concept:

```ts
getIndexList(tenant: Pick<Tenant, "id">): Promise<IOpensearchIndexConfig[]>
```

Multiple implementations register; today only Headless CMS does
(`packages/api-headless-cms-ddb-es/src/tasks/createIndexTaskPlugin.ts`), enumerating every content
model through `CmsModelOpenSearchIndexProvider`. The `listIndexes()` helper
(`packages/api-elasticsearch-tasks/src/tasks/createIndexes/listIndexes.ts`) combines factories across
tenants.

**Use this as the allowlist.** Any index not returned by a registered factory is not touchable. That
is strictly better than pattern-matching index names, and it means new subsystems become manageable
automatically by implementing the abstraction.

Index names themselves come out as `{prefix}{tenant|root}-headless-cms-{modelId}`
(`packages/api-headless-cms-ddb-es/src/configurations.ts`), but nothing should be reconstructing that
string by hand.

### Two of the three operations already exist as tasks

`packages/api-elasticsearch-tasks` ships `elasticsearchReindexing`, `createIndexes`,
`enableIndexing`, and `dataSynchronization`.

| Operation | Status |
| --- | --- |
| Create index | `createIndexes` task exists. For a single index, doing it synchronously through `IndexManager` is probably better — a task is overhead for something that takes a moment. |
| Reindex | `elasticsearchReindexing` exists. Just trigger it. |
| **Delete index** | **Nothing exists.** The only genuinely new API work. |

Triggering is a use case, not an HTTP call:

```ts
TriggerTaskUseCase.execute({ definition: "elasticsearchReindexing", input })
```

### The Dev Tools menu already exists

`packages/app-graphql-playground/src/index.tsx:30` declares:

```tsx
<Menu name={"dev-tools"} hideIfEmpty={true} pin={"end"} … />
```

A new tool adds a child with `parent={"dev-tools"}`. `hideIfEmpty` means the whole menu disappears
when nothing under it is permitted — which is the behaviour wanted for a tool that should be invisible
on non-OpenSearch deployments.

## The background-task permission question

`backgroundTasks.task` does exist, with `rwd` actions
(`packages/background-tasks/src/api/permissions.ts`).

But it is **not** required: `TriggerTaskUseCaseImpl` does not check permissions. The check lives in
the GraphQL layer (`packages/background-tasks/src/api/graphql/checkPermissions.ts`). A resolver in
the new package calling the use case directly bypasses it.

So this is a decision rather than a constraint. **Recommendation: let the OpenSearch permission stand
alone.** Requiring two permissions to press one button generates support calls, and the user has
already been granted something more dangerous than task-running.

## The permission problem — settle this first

`dev-tools` as a prefix is already claimed **twice**, both with `fullAccess: true`:

- `packages/app-graphql-playground/src/PermissionsSchema.ts:3`
- `packages/app-sdk-playground/src/PermissionsSchema.ts:4`

Two consequences:

1. **`minimatch("dev-tools.opensearch", "dev-tools.*") === true`.** Every role holding Dev Tools full
   access — commonly granted just for GraphQL Playground — would gain **index deletion**.

   The debugger spec accepted the equivalent exposure deliberately, because reading query internals is
   not destructive and a full-access admin can already read the data. Dropping a production search
   index is a different category of action and deserves a different answer.

2. **`Security.Permissions` keys renderers by name**, so a third registration using
   `name="dev-tools"` replaces one of the playgrounds' entries in the role editor depending on mount
   order. This is already a latent bug between the two existing packages; a third makes it worse.

Options:

- **A distinct prefix** (`opensearch.admin`, or similar). Clean, no inherited grants, but adds a
  second Dev Tools-ish permission group in the role editor.
- **Consolidate the `dev-tools` schema** into one shared place that all three packages extend. Fixes
  the existing collision too, but is a bigger change and still leaves `dev-tools.*` granting
  deletion unless the entity is deliberately excluded from wildcards.

## OpenSearch-only registration

The signal chain today:

```
<Infra.OpenSearch enabled={true} />      packages/project-aws/src/extensions/OpenSearch.tsx
  → <DatabaseSetup setupName="ddb+os" />
  → Pulumi core stack output databaseSetup === "ddb+os"
  → ReplaceApiLambdaFnHandlers swaps the API handlers
```

**Cleanest approach: do not detect anything.** Register the API half from the ddb-es side so it is
physically absent from a DynamoDB-only build.

The Admin half cannot do the same, because the Admin bundle is identical in both deployments. It has
to ask the API — either a small availability query, or simply keying off the absence of the field in
the schema.

## Package shape

`@webiny/webhooks` uses `src/{api,admin,exports}` with exports `"."`, `"./api"`, `"./admin/*"`,
`"./*"`. Note it has no `shared` folder. Worth checking whether one is actually needed here — the only
obvious candidates are the permission schema and the GraphQL operation names.

## Design ideas

**Frame it as "Rebuild index", not three buttons.** Delete → create → reindex is the real workflow;
the three primitives are how you get there. Three independent buttons invite someone to delete and
walk away, leaving search silently broken. A guided flow with the primitives still available
underneath matches why anyone opens this tool in the first place.

**Deletion is recoverable — say so in the UI.** DynamoDB is the source of truth and the index is
derived, so the cost of a delete is a reindex window, not data loss. Stating that on the confirmation
screen prevents both panic and over-caution.

**Guard against concurrent operations.** Deleting an index while a reindex task is running, or while
writes are flowing, is the obvious footgun. Check for a running task against that index before
allowing a delete.

**Current tenant only for v1.** `getIndexList` is per-tenant, and cross-tenant index management opens
a much larger permission question.

**Audit destructive actions.** `api-audit-logs` exists, and infrastructure-level destruction
initiated from the Admin UI is what it is for.

## Open questions

1. Permission prefix — distinct, or consolidate `dev-tools`?
2. Is `backgroundTasks.task` also required, or does the OpenSearch permission stand alone?
3. Guided rebuild flow, or three independent operations?
