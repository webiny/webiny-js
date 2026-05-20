# Entry Data Factories as Injectable Features

**Date:** 2026-05-13
**Branch:** `bruno/feat/api-headless-cms/entry-data-factories`
**Package:** `@webiny/api-headless-cms`

## Problem

The six entry data factories in `packages/api-headless-cms/src/crud/contentEntry/entryDataFactories/` were plain `async` functions imported directly by their use cases. They could not be substituted in tests, overridden by plugin authors, or injected via DI.

## Decision

Move each factory to `features/contentEntry/entryDataFactories/<FactoryName>/` as a first-class injectable feature. Each factory wraps the existing function in a class, owns its DI dependencies, and is registered as a singleton.

The existing factory functions in `crud/contentEntry/entryDataFactories/` remain — the new implementations delegate to them. They become internals, no longer imported outside the features tree.

## Structure

```
features/contentEntry/entryDataFactories/
├── EntryDataFactoriesFeature.ts          ← registers all 6; included in ContentEntriesFeature
├── CreateEntryDataFactory/
├── UpdateEntryDataFactory/
├── CreateEntryRevisionFromDataFactory/
├── CreatePublishEntryDataFactory/
├── CreateUnpublishEntryDataFactory/
└── CreateRepublishEntryDataFactory/
```

Each folder: `abstractions.ts` · `FactoryName.ts` · `feature.ts` · `index.ts`

## Per-factory Convention

**`abstractions.ts`** — scoped token + interface + namespace:
```ts
export const CreateEntryDataFactory =
    createAbstraction<ICreateEntryDataFactory>("Cms/Entry/CreateEntryDataFactory");

export namespace CreateEntryDataFactory {
    export type Interface = ICreateEntryDataFactory;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> = ICreateEntryDataResponse<TValues>;
}
```

**`FactoryName.ts`** — `createImplementation` wrapping the existing function:
```ts
class CreateEntryDataFactoryImpl implements ICreateEntryDataFactory {
    constructor(
        private readonly cmsContext: CmsContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly accessControl: AccessControl.Interface
    ) {}

    create(model, rawInput, options) {
        return createEntryData({ model, rawInput, options,
            context: this.cmsContext,
            getIdentity: () => this.identityContext.getIdentity(),
            getTenant: () => this.tenantContext.getTenant(),
            accessControl: this.accessControl
        });
    }
}

export const CreateEntryDataFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: CreateEntryDataFactoryImpl,
    dependencies: [CmsContext, IdentityContext, TenantContext, AccessControl]
});
```

**`feature.ts`** — singleton scope (factories are stateless):
```ts
export const CreateEntryDataFactoryFeature = createFeature({
    name: "CreateEntryDataFactory",
    register(container) {
        container.register(CreateEntryDataFactory).inSingletonScope();
    }
});
```

## Token Scoping

All factory tokens use `Cms/Entry/` prefix: `"Cms/Entry/CreateEntryDataFactory"`, etc.

Existing use case tokens in the same package are not yet scoped — that is a separate cleanup task.

## Dependencies per Factory

| Factory | Dependencies |
|---|---|
| `CreateEntryDataFactory` | CmsContext, IdentityContext, TenantContext, AccessControl |
| `UpdateEntryDataFactory` | CmsContext, IdentityContext, TenantContext |
| `CreateEntryRevisionFromDataFactory` | CmsContext, IdentityContext, TenantContext, AccessControl |
| `CreatePublishEntryDataFactory` | CmsContext, IdentityContext |
| `CreateUnpublishEntryDataFactory` | IdentityContext |
| `CreateRepublishEntryDataFactory` | CmsContext, IdentityContext |

## Use Case Call Site (next step)

Once use cases are wired, the call simplifies from ~6 params to:
```ts
const { entry, input } = await this.createEntryDataFactory.create(model, rawInput, options);
```

## What's Next

Wire the 6 use cases (`CreateEntry`, `UpdateEntry`, `CreateEntryRevisionFrom`, `PublishEntry`, `UnpublishEntry`, `RepublishEntry`) to inject their factory instead of importing the function directly. After that, the old factory functions in `crud/` can be considered implementation details and eventually inlined or removed.
