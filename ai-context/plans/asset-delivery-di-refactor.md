# Asset Delivery Refactoring Plan

## Context

The asset delivery system in `api-file-manager` and `api-file-manager-s3` manually `new`s all its components and uses a custom `AssetDeliveryConfigBuilder` + `AssetDeliveryConfigModifierPlugin` pattern to wire things together. This is inconsistent with the rest of the codebase, which uses `createAbstraction()`, `createImplementation()`, `createDecorator()`, `createFeature()`, and the DI `Container` for all service wiring. The goal is to align asset delivery with these patterns.

**Scope:** Only the delivery subsystem. The existing features (DeleteFileFromBucket, ExtractMetadata, FlushCache, etc.) and the GraphQL resolvers in `api-file-manager-s3` are out of scope.

### Key Design Decisions

- Asset delivery is **one feature** — all abstractions live in `features/assetDelivery/abstractions.ts`
- All implementation files **move** from `delivery/AssetDelivery/` into `features/assetDelivery/`
- `delivery/` retains only data models (`Asset`, `AssetRequest`, `AssetReply`), utility wrappers (`SetResponseHeaders`, `SetCacheControlHeaders`), the plugin loader, the setup entry point, and the re-export index
- Internal value objects (`AssetKeyGenerator`, `WidthCollection`, `CallableContentsReader`) stay as `new` — they're not services

### DI API Reference

- `createAbstraction<T>(name)` — DI token
- `abstraction.createImplementation({ implementation, dependencies })` — binds class to token
- `abstraction.createDecorator({ decorator, dependencies })` — wraps resolved value (decoratee = **last** ctor param)
- `container.register(impl)` / `.inSingletonScope()` — registers
- `container.registerDecorator(decorator)` — registers decorator
- `container.registerInstance(abstraction, value)` — registers pre-built value
- `container.resolve(abstraction)` — resolves with decorators applied

### Lifecycle Constraint

- `RegisterExtensionPlugin` runs **before** `HandlerOnRequestPlugin` (asset request/resolution)
- `ContextPlugin` runs **after** `HandlerOnRequestPlugin` (`FileManagerFeature` registers `GetFileUseCase`)
- `AssetDeliveryFeature` must register via `RegisterExtensionPlugin`
- `PrivateFilesAssetProcessor` needs `GetFileUseCase` but runs in Route handler (after ContextPlugins) — safe

---

## Phase 1: Abstractions + Feature Skeleton

**Goal:** Create the new `features/assetDelivery/` directory with abstractions, the feature definition, and the entry point wiring. No file moves yet — the feature registers implementations by `new`-ing existing classes directly (bridging old and new).

### Files

| File (relative to `packages/api-file-manager/src/`) | Action |
|---|---|
| `features/assetDelivery/abstractions.ts` | **New**: all DI abstractions + interfaces |
| `features/assetDelivery/feature.ts` | **New**: `AssetDeliveryFeature` — registers defaults by wrapping existing classes in `registerInstance` / `registerFactory` calls |
| `index.ts` | Modify: `createAssetDelivery()` uses `RegisterExtensionPlugin` to register `AssetDeliveryFeature` |
| `delivery/setupAssetDelivery.ts` | Rewrite: resolve `AssetRequestResolver`, `AssetResolver`, `AssetProcessor`, `AssetOutputStrategy` from container instead of from `AssetDeliveryConfigBuilder` |
| `delivery/index.ts` | Update: add re-exports from `features/assetDelivery/abstractions.ts` |

### Details

**`abstractions.ts`** — interfaces + DI tokens:
```typescript
export interface IAssetRequestResolver { resolve(request: Request): Promise<AssetRequest | undefined>; }
export interface IAssetResolver { resolve(request: AssetRequest): Promise<Asset | undefined>; }
export interface IAssetProcessor { process(assetRequest: AssetRequest, asset: Asset): Promise<Asset>; }
export interface IAssetOutputStrategy { output(asset: Asset): Promise<AssetReply>; }
export interface IAssetTransformationStrategy { transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset>; }
export interface IAssetContentsReader { read(asset: Asset): Promise<Buffer>; }
export interface IAssetAuthorizer { authorize(file: File): Promise<void>; }

export const AssetRequestResolver = createAbstraction<IAssetRequestResolver>("AssetDelivery/AssetRequestResolver");
export const AssetResolver = createAbstraction<IAssetResolver>("AssetDelivery/AssetResolver");
export const AssetProcessor = createAbstraction<IAssetProcessor>("AssetDelivery/AssetProcessor");
export const AssetOutputStrategy = createAbstraction<IAssetOutputStrategy>("AssetDelivery/AssetOutputStrategy");
export const AssetTransformationStrategy = createAbstraction<IAssetTransformationStrategy>("AssetDelivery/AssetTransformationStrategy");
export const AssetContentsReader = createAbstraction<IAssetContentsReader>("AssetDelivery/AssetContentsReader");
export const AssetAuthorizer = createAbstraction<IAssetAuthorizer>("AssetDelivery/AssetAuthorizer");

// Namespaces for type access
export namespace AssetRequestResolver { export type Interface = IAssetRequestResolver; }
// ... same for all
```

**`feature.ts`** — bridge phase: uses existing classes directly via `registerFactory`/`registerInstance`:
```typescript
export const AssetDeliveryFeature = createFeature({
    name: "AssetDelivery",
    register(container) {
        // Base defaults — using old classes directly for now
        container.registerFactory(AssetRequestResolver, () => {
            const base = new FilesAssetRequestResolver();
            return new PrivateFileAssetRequestResolver(base);
        });
        container.registerFactory(AssetTransformationStrategy, () => new PassthroughAssetTransformationStrategy());
        container.registerFactory(AssetProcessor, () => new TransformationAssetProcessor(container.resolve(AssetTransformationStrategy)));
        container.registerFactory(AssetOutputStrategy, () => new NullAssetOutputStrategy());
        container.registerFactory(AssetResolver, () => new NullAssetResolver());

        // Conditional: private files
        const wcp = container.resolve(WcpContext);
        if (wcp.canUsePrivateFiles()) {
            container.registerFactory(AssetAuthorizer, () => new PrivateAuthenticatedAuthorizer(context));
            // PrivateFilesAssetProcessor registered as processor decorator — TBD in phase 2
        }
    }
});
```

**`setupAssetDelivery.ts`** — resolve from container, remove builder:
- Remove `AssetDeliveryConfigBuilder` usage
- Remove `configPlugins.forEach(...)` iteration
- `container.resolve(AssetRequestResolver)` instead of `configBuilder.getAssetRequestResolver()`
- Same for `AssetResolver`, `AssetProcessor`, `AssetOutputStrategy`

**`index.ts`** — entry point:
```typescript
export const createAssetDelivery = () => [
    createRegisterExtensionPlugin(context => {
        AssetDeliveryFeature.register(context.container);
    }),
    ...setupAssetDelivery()
];
```

### Verify

```bash
yarn build -p @webiny/api-file-manager --no-cache --safe-replace 2>&1 | tail -30
yarn build -p @webiny/api-file-manager-s3 --no-cache --safe-replace 2>&1 | tail -30
```

---

## Phase 2: Move Files + Add `createImplementation` / `createDecorator`

**Goal:** Move all implementation classes from `delivery/AssetDelivery/` into `features/assetDelivery/`. Add proper `createImplementation` and `createDecorator` exports. Update the feature to use `container.register()` instead of `registerFactory()`. Delete old locations.

### Files to Move (all relative to `packages/api-file-manager/src/`)

| From (`delivery/AssetDelivery/`) | To (`features/assetDelivery/`) | DI registration to add |
|---|---|---|
| `FilesAssetRequestResolver.ts` | `FilesAssetRequestResolver.ts` | `AssetRequestResolver.createImplementation({ implementation, dependencies: [] })` |
| `NullAssetResolver.ts` | `NullAssetResolver.ts` | `AssetResolver.createImplementation({ implementation, dependencies: [] })` |
| `NullAssetOutputStrategy.ts` | `NullAssetOutputStrategy.ts` | `AssetOutputStrategy.createImplementation({ implementation, dependencies: [] })` |
| `transformation/PassthroughAssetTransformationStrategy.ts` | `transformation/PassthroughAssetTransformationStrategy.ts` | `AssetTransformationStrategy.createImplementation({ implementation, dependencies: [] })` |
| `transformation/TransformationAssetProcessor.ts` | `transformation/TransformationAssetProcessor.ts` | `AssetProcessor.createImplementation({ implementation, dependencies: [AssetTransformationStrategy] })` |
| `privateFiles/PrivateFileAssetRequestResolver.ts` | `privateFiles/PrivateFileAssetRequestResolver.ts` | `AssetRequestResolver.createDecorator({ decorator, dependencies: [] })` |
| `privateFiles/PrivateAuthenticatedAuthorizer.ts` | `privateFiles/PrivateAuthenticatedAuthorizer.ts` | `AssetAuthorizer.createImplementation(...)` — refactor ctor to take specific DI deps instead of `ApiCoreContext` |
| `privateFiles/PrivateFilesAssetProcessor.ts` | `privateFiles/PrivateFilesAssetProcessor.ts` | `AssetProcessor.createDecorator(...)` — refactor ctor to `(security, getFile, authorizer, decoratee)` |

**Also move** (no DI changes):
- `privateFiles/NotAuthorizedAssetReply.ts`
- `privateFiles/NotAuthorizedOutputStrategy.ts`
- `privateFiles/RedirectToPublicUrlOutputStrategy.ts`
- `privateFiles/RedirectToPrivateUrlOutputStrategy.ts`
- `privateFiles/PrivateCache.ts`
- `privateFiles/PublicCache.ts`

### Files to Delete

| File | Reason |
|---|---|
| `delivery/AssetDelivery/AssetDeliveryConfig.ts` | Builder + plugin + decorator types — replaced by DI |
| `delivery/AssetDelivery/NullRequestResolver.ts` | Only used as reduce seed in builder |
| `delivery/AssetDelivery/abstractions/` | Entire directory — interfaces moved to `features/assetDelivery/abstractions.ts` |
| `delivery/AssetDelivery/FilesAssetRequestResolver.ts` | Moved |
| `delivery/AssetDelivery/NullAssetResolver.ts` | Moved |
| `delivery/AssetDelivery/NullAssetOutputStrategy.ts` | Moved |
| `delivery/AssetDelivery/transformation/` | Moved |
| `delivery/AssetDelivery/privateFiles/` | Moved |

### Files to Keep in `delivery/`

- `Asset.ts`, `AssetRequest.ts` — data model classes
- `SetCacheControlHeaders.ts`, `SetResponseHeaders.ts` — imperative output strategy wrappers
- `createAssetDeliveryPluginLoader.ts` — code-splitting utility
- `setupAssetDelivery.ts` — Fastify route setup (already rewritten in Phase 1)
- `index.ts` — re-exports

### Update Feature

Replace `registerFactory()` bridge calls with proper `container.register()`:

```typescript
export const AssetDeliveryFeature = createFeature({
    name: "AssetDelivery",
    register(container) {
        container.register(FilesAssetRequestResolverImpl);
        container.register(NullAssetResolverImpl);
        container.register(NullAssetOutputStrategyImpl);
        container.register(PassthroughAssetTransformationStrategyImpl);
        container.register(TransformationAssetProcessorImpl);

        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        const wcp = container.resolve(WcpContext);
        if (wcp.canUsePrivateFiles()) {
            container.register(PrivateAuthenticatedAuthorizerImpl);
            container.registerDecorator(PrivateFilesAssetProcessorDecorator);
        }
    }
});
```

### Update `delivery/index.ts`

Remove old exports, re-export from `features/assetDelivery/`:
- Abstractions/interfaces from `features/assetDelivery/abstractions.ts`
- Data models (`Asset`, `AssetRequest`, `AssetReply`) stay local
- `SetCacheControlHeaders`, `SetResponseHeaders` stay local
- `createAssetDeliveryPluginLoader` stays local

### Update Imports Across Monorepo

Search for all imports from `delivery/AssetDelivery/` paths and update to new `features/assetDelivery/` locations.

### Verify

```bash
yarn build -p @webiny/api-file-manager --no-cache --safe-replace 2>&1 | tail -30
yarn build -p @webiny/api-file-manager-s3 --no-cache --safe-replace 2>&1 | tail -30
yarn test packages/api-file-manager 2>&1 | tail -50
```

---

## Phase 3: Refactor S3 Package

**Goal:** Replace S3's `assetDeliveryConfig.ts` config-modifier-plugin pattern with a proper DI feature.

### Files (relative to `packages/api-file-manager-s3/src/assetDelivery/`)

| File | Action |
|---|---|
| `abstractions.ts` | **New**: `S3AssetDeliveryConfig`, `S3Client`, `S3Bucket` abstractions |
| `feature.ts` | **New**: `createS3AssetDeliveryFeature(params)` |
| `s3/S3AssetResolver.ts` | Modify: add `AssetResolver.createImplementation(...)`, dependencies `[GlobalKeyValueStore, S3Client, S3Bucket]` |
| `s3/S3OutputStrategy.ts` | Modify: refactor ctor to take config object, add `AssetOutputStrategy.createImplementation(...)` |
| `s3/SharpTransform.ts` | Modify: refactor ctor to take config object, add `AssetTransformationStrategy.createImplementation(...)` |
| `assetDeliveryConfig.ts` | Rewrite: use feature + `RegisterExtensionPlugin` instead of `createAssetDeliveryConfig()` plugin |

### Details

**`abstractions.ts`:**
```typescript
export interface IS3AssetDeliveryConfig {
    presignedUrlTtl: number;
    imageResizeWidths: number[];
    assetStreamingMaxSize: number;
}
export const S3AssetDeliveryConfig = createAbstraction<IS3AssetDeliveryConfig>("AssetDelivery/S3Config");
export const S3Client = createAbstraction<S3>("AssetDelivery/S3Client");
export const S3Bucket = createAbstraction<string>("AssetDelivery/S3Bucket");
```

**`feature.ts`:**
```typescript
export const createS3AssetDeliveryFeature = (params: AssetDeliveryParams = {}) => {
    return createFeature({
        name: "AssetDelivery/S3",
        register(container) {
            container.registerInstance(S3Client, new S3({ region: process.env.AWS_REGION as string }));
            container.registerInstance(S3Bucket, process.env.S3_BUCKET as string);
            container.registerInstance(S3AssetDeliveryConfig, {
                presignedUrlTtl: params.presignedUrlTtl ?? 3600,
                imageResizeWidths: params.imageResizeWidths ?? [128, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
                assetStreamingMaxSize: params.assetStreamingMaxSize ?? 4718592
            });

            container.register(S3AssetResolverImpl);
            container.register(S3OutputStrategyImpl);
            container.register(SharpTransformImpl);
        }
    });
};
```

**`assetDeliveryConfig.ts`:**
```typescript
export const assetDeliveryConfig = (params: AssetDeliveryParams) => {
    const feature = createS3AssetDeliveryFeature(params);
    return [
        createBaseAssetDelivery(),
        createRegisterExtensionPlugin(context => {
            feature.register(context.container);
        })
    ];
};
```

### Verify

```bash
yarn build -p @webiny/api-file-manager-s3 --no-cache --safe-replace 2>&1 | tail -30
yarn test packages/api-file-manager-s3 2>&1 | tail -50
```

---

## Notes

- The `createAssetDeliveryPluginLoader` (lazy loading via dynamic import) should be preserved — the loaded code registers a DI feature instead of a config modifier plugin.
- Data model classes (`Asset`, `AssetRequest`, `AssetReply`) stay in `delivery/`.
- `SetCacheControlHeaders` and `SetResponseHeaders` stay in `delivery/` — imperative wrappers, not DI services.
- `PassthroughAssetProcessor.ts` can be deleted if unused after the refactor.
- The threat detection subsystem is out of scope.
