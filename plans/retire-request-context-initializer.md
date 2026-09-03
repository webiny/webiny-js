# Retiring `RequestContextInitializer`

> Supersedes `tenant-lifecycle-module.md`, which designed a phased lifecycle (`setup` / `afterSetup`)
> for this problem. An audit showed the problem is not a scheduling problem, so no phase system, no
> `Module` abstraction, and no `createFeature` change are needed. Prototype PR #5613 is closed.

## The diagnosis

`RequestContextInitializer` exists to solve one thing: an **async value that is injected
synchronously**.

```ts
// the shape that forces a lifecycle hook
export const FileModel = createAbstraction<CmsModel>("FileModel"); // no implementation, ever
```

Nothing implements that abstraction. It is _populated by a side effect_ — a hook resolves the model
and does `registerInstance(FileModel, model)` before anything can ask for it. An abstraction with no
implementation is a scheduling dependency wearing a DI costume: resolving it builds nothing, it just
reads whatever an earlier phase deposited.

DI resolves constructor arguments **synchronously**, and fetching a model is **async** (the whole
chain is: `GetModelUseCase` → `GetModelRepository` → `ModelsFetcher.fetchById()`, merging
code-defined + DB-defined models per tenant, then access control). You cannot await inside sync
constructor resolution, so someone had to put the finished value there first.

Every piece of machinery follows from that "first": five firing sites, `initialized` flags,
`getTenant()` guards, registration-order comments, and a per-path error-mode split.

## The fix

Replace the synchronously-injected async value with a **provider awaited at the point of use**.

```ts
- private fileModel: FileModel.Interface                    // = CmsModel, must already exist
+ private fileModelProvider: FileModelProvider.Interface     // = { get(): Promise<CmsModel> }

  async execute(id: string) {
+     const fileModel = await this.fileModelProvider.get();
-     const result = await this.getEntryById.execute(this.fileModel, `${id}#0001`);
+     const result = await this.getEntryById.execute(fileModel, `${id}#0001`);
```

**Constructors cannot await; methods can.** That is the entire mechanism. The provider is a plain
object, so DI can build it at any time with no prior setup — and it cannot run too early, because
what triggers it is something actually needing the model.

This is not a new pattern here. Extension models (`extensions/models/*`) already work this way:
`ModelFactory` impls with an `async execute()`, consumed lazily through `ModelsProvider`. Built-in
models were the odd ones out. `GraphQLContextualSchema` has the same shape too (below). So this
finishes an existing pattern rather than introducing one.

## Counts (corrected twice — do not trust name-pattern greps)

An earlier pass grepped by _name_ (`*Initializer|*ContextualSchema`) and conflated distinct
abstractions. Counting by what things actually implement:

| Mechanism                   | Count                                           | In scope?                           |
| --------------------------- | ----------------------------------------------- | ----------------------------------- |
| `RequestContextInitializer` | **9** (3 classes + 6 inline `registerInstance`) | yes — this is the work              |
| `GraphQLContextualSchema`   | 3                                               | no — already pull-based (see below) |
| `GraphQLContextEnhancer`    | —                                               | no — but see the misuse below       |

Plus **5 firing sites** for `RequestContextInitializer`: the `RequestContextInitializerDecorator` on
`HttpRouter` (fail-fast) and four hand-written calls — bg-task aws + server, scheduler run +
recover (all `continueOnError`).

**Not in scope, contrary to earlier claims:** bulk actions (`HcmsBulkActionsFeature` registers
entirely at `register()` time and is live via `HcmsTasksFeature`) and background tasks
(`BackgroundTasksFeature` registers at `register()` time). Neither blocks deletion.

## The 9, and what each needs

| Contributor                            | Shape                                                                                | Fix                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FileModelContextualSchema`            | model                                                                                | **done** — provider                                                                                                                                                                          |
| `SchedulerModelContextualSchema`       | model                                                                                | provider                                                                                                                                                                                     |
| `WebsiteBuilderFeature` (inline)       | 4 models                                                                             | provider                                                                                                                                                                                     |
| `WorkflowsInitializer`                 | 2 models + 24 registrations                                                          | provider; move the 24 into `register()` — they never needed the models to exist                                                                                                              |
| `AcoInitializer`                       | model + FLP decorators + schema factories                                            | provider; decorators → `register()` (license is pre-loaded, so the flag gate is valid there); schema factories registered eagerly with the async load inside the already-awaited `execute()` |
| `api-scheduler-aws/context.ts`         | not a model — awaits `getManifest()`, picks EventBridge vs Void                      | provider for `SchedulerService`                                                                                                                                                              |
| `HcmsTasks` `createDeleteModelCrud`    | not a model — builds `DeleteModelOperations`, already hand-rolls `createMemoryCache` | provider (it is a memoizing provider written inline)                                                                                                                                         |
| `HcmsTasks` `createDeleteModelGraphQl` | consumes the above                                                                   | merge, or provider                                                                                                                                                                           |
| `fm-s3` + `fm-server` assetDelivery    | async dynamic `import()`, tenant-independent, env-gated                              | relocate to **cold start** — currently re-imports every request                                                                                                                              |

## Findings from the deep inspections

**The `HcmsTasks` crud→gql ordering constraint is stale.** `HcmsTasksFeature.ts:14-20` says the crud
initializer _"MUST run before the GraphQL initializer, whose resolvers resolve
`DeleteModelOperations`"_. But those resolvers call
`context.container.resolve(DeleteModelOperations)` **inside resolver bodies** — at GraphQL execution
time, long after both initializers finish. The stated reason does not hold; the pair is mergeable.

**There _is_ a real ordering constraint, but it is internal to crud.** `DisableModelFeature.register()`
resolves `DeleteModelOperations` eagerly, at register time, to bind a method off it:

```ts
const ops = container.resolve(DeleteModelOperations);
container.registerInstance(
  Abstraction,
  new BlockActionIfModelDisabled(ops.isModelBeingDeleted.bind(ops))
);
```

That is why it is invoked from _inside_ `createDeleteModelCrud.init()`, immediately after
`registerInstance(DeleteModelOperations, operations)`. Self-contained, so it does not constrain the
gql side.

**The conversion is clean.** `DeleteModelOperations` is already provider-shaped — every member is an
async function, and the tenant is read lazily inside closures (`const getTenant = () =>
...resolve(TenantContext).getTenant().id`). It needs a hook today only because it is built from
closures over `context` inside `init()`. Rewritten as an ordinary DI class taking `TenantContext` +
`GlobalKeyValueStore` it becomes sync-constructible, so `DisableModelFeature.register()` keeps
working unchanged. Also check whether its hand-rolled `createMemoryCache` is still warranted, per
the cache rule below.

**`GraphQLContextualSchema` is not a legacy hook — I was wrong to call it one.** Its shape is
already correct:

```ts
interface IGraphQLContextualSchema {
  build(ctx): Promise<GraphQLSchema>;
}
```

...injected into `GraphQLEngine` as `[GraphQLContextualSchema, { multiple: true }]` and awaited when
serving a request. Sync registration, async value, awaited at consumption — the provider pattern.

**The real smell is its misuse.** All four bg-task/scheduler handlers do:

```ts
for (const schema of this.container.resolveAll(GraphQLContextualSchema)) {
  await schema.build(ctx); // result DISCARDED
}
```

They call "build the GraphQL schema" **for its side effects**, in a context with no GraphQL at all,
and throw the schema away — alongside a `GraphQLContextEnhancer` loop and a
`TODO: remove once legacy ctx is gone`. Once the side effects those `build()` calls perform become
providers, background tasks stop needing to build a schema. That is a follow-up, tracked separately.

## Slices

Each independently mergeable; deletion last.

| #   | Slice                                                                                                                   | Size                     |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 0   | Close #5613 with the audit reasoning                                                                                    | —                        |
| 1   | `FileModel` → provider                                                                                                  | **done**, 69 tests green |
| 2   | Scheduler                                                                                                               | 2 consumers              |
| 3   | Workflows: providers + move 24 registrations to `register()`                                                            | 10 consumers             |
| 4   | WebsiteBuilder: 4 models                                                                                                | —                        |
| 5   | Aco: provider + decorators + schema factories                                                                           | 9 consumers              |
| 6   | assetDelivery ×2 → cold start                                                                                           | small                    |
| 7   | `HcmsTasks` DeleteModel: merge the pair                                                                                 | small                    |
| 8   | `api-scheduler-aws`: `SchedulerService` provider                                                                        | small                    |
| 9   | **Delete** `RequestContextInitializer`, `runRequestContextInitializers`, the `HttpRouter` decorator, the 4 manual calls | payoff                   |

No shared helper. An earlier draft planned a `createCmsModelProvider(abstraction, MODEL_ID)` to avoid
copying memoization and `withoutAuthorization` nine times — but both turned out to be unnecessary
(see Rules), so a provider is now four lines. Four clear lines beat an indirection.

## Rules

- **Do not add a cache to a provider without checking the layer below.** `ModelsFetcher` already
  caches the model list per request (`ModelCache` is a per-request `createMemoryCache()`, registered
  in `ContentModelFeature`), so a memo in the provider buys only a repeat access-control check and
  an array lookup — at the cost of two caches with two lifetimes. The `FileModelProvider` is
  therefore stateless.
- **If a provider _does_ memoize, register it per request, never at root.** A root-scoped singleton
  is shared by every child container, so its memo leaks across tenants. Demonstrated by a failing
  test in the prototype; keep it encoded wherever it applies.
- **Drop `withoutAuthorization` — but only for `.private()` models.** The initializers all wrapped
  the model fetch in it, and for a private model it is a no-op:

  ```
  builder.private(...)                       → PrivateModelBuilder.ts:23 sets authorization: false
  canAccessModel({ model, rwd: "r" })
    → hasFullAccessToModels({ model })
      → modelAuthorizationDisabled({ model })  → authorization === false → true
    → full ACL, granted for EVERY identity
  ```

  All nine remaining models are `.private()` (verified: `folder.model.ts`, `SchedulePrivateModel`,
  `WorkflowPrivateModel`, `WorkflowStatePrivateModel`, and all four Website Builder models), so no
  provider needs it. **Confirm `.private()` per model before dropping it** — this is the one place
  the refactor could silently weaken authorization. If a model is ever flipped to `.public()`,
  `canAccessModel` starts applying the real ACL and the wrapper's absence becomes load-bearing.

- **Fix the name collision as you go.** Every package has two exports with the same name — the
  `ModelFactory` _definition_ and the resolved-instance _abstraction_ (`FileModel` ×2,
  `FolderModel` ×2, …). Renaming the second to `XModelProvider` removes it.
- **Check each consumer touches the model inside an `async` method.** Verified for file-manager's 8.
  A constructor-time use would need different treatment — the main unretired risk.

## Regression guard

The anti-pattern has an exact signature. **9 remain** (`FileModel` already converted):

```
createAbstraction<CmsModel>(...)   →  api-aco (Folder), api-website-builder (Page, Redirect,
                                      Variant, Experiment), api-record-locking, api-scheduler,
                                      api-workflows (Workflow, WorkflowState)
```

Add a ratchet test starting at 9, lowered per slice, ending at 0. It is really a test for "no
abstraction that can only be filled by an earlier phase".

## Extensions are unaffected

The public/private split is exactly the dividing line, and it is clean:

|                                                             | Builder      | `authorization` | Access control       | In the 9 |
| ----------------------------------------------------------- | ------------ | --------------- | -------------------- | -------- |
| Extension models (`Blog`, `Article`, `Product`, …)          | `.public()`  | not disabled    | **applies normally** | no       |
| Internal models (`fmFile`, `Folder`, `Workflow`, `Page`, …) | `.private()` | `false`         | short-circuited      | yes      |

Extension models are consumed as a _collection_ (`resolveAll(ModelFactory)` → `ModelsProvider` →
schema generation), which this work does not touch, and `createAbstraction<CmsModel>` has **zero**
hits across `extensions/` and `apps/` — nobody injects a resolved extension model, so there is
nothing of this shape to convert. Dropping `withoutAuthorization` from internal providers cannot
affect public models, because those never went through the internal providers.

## Bonus

`registerApiRequestStack` carries _"ORDER IS LOAD-BEARING — extensions must be applied before any
initializer (e.g. ACO) lists + caches the per-request model set."_ That exists only because ACO
eagerly caches. Slice 5 removes the reason.
