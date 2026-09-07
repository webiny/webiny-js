# Check The Layer Below Before Caching

Before adding a cache to a provider or lazy service, look at what it calls. If that layer already
caches, your cache is dead weight that adds a second thing to invalidate. If it doesn't, memoize.

Answer it per class. The same refactor produced both answers several times over.

```ts
// Good — stateless, because the layer below caches.
// GetModelUseCase goes through ModelsFetcher -> ModelCache, a per-request memory cache, so a
// second get() is already cheap.
class FileModelProviderImpl implements FileModelProvider.Interface {
  constructor(private getModel: GetModelUseCase.Interface) {}

  async get(): Promise<CmsModel> {
    const result = await this.getModel.execute(FILE_MODEL_ID);
    if (result.isFail()) {
      throw result.error;
    }
    return result.value;
  }
}
```

```ts
// Good — memoized, because nothing below holds the imported module.
class LazySharpTransformImpl implements AssetTransform.Interface {
  private sharp: SharpModule | undefined;

  private async getSharp(): Promise<SharpModule> {
    if (!this.sharp) {
      this.sharp = await import("sharp");
    }
    return this.sharp;
  }
}
```

Worked examples from the provider migration:

| Provider                                  | Layer below                                    | Cache?    |
| ----------------------------------------- | ---------------------------------------------- | --------- |
| File / Folder / Workflow / Scheduler / WB | `ModelsFetcher` → per-request `ModelCache`     | stateless |
| `LazySchedulerService`                    | `ServiceDiscovery.load()`, process-wide static | stateless |
| `DeleteModelOperations`                   | nothing caches the key-value reads             | memoize   |
| `LazySharpTransform`                      | nothing holds the imported module              | memoize   |

## A memoizing provider must be registered per request

Register it on the request container, never at root. A root singleton is shared by every child
container, so a cached value leaks across tenants. This is not theoretical — it was caught by a
failing test during the migration.

Same trap in the other direction for anything that captures a container: a service registered at
root captures the root container and sees none of the per-request registrations, so a
container-capturing `EventPublisher` registered at root resolves zero per-request handlers.
