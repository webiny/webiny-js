# Prefer A Provider Over A Resolved Value

Inject the thing that produces a value, not the value itself. When a class needs data that another
class has to fetch, depend on a provider with an async `get()` and await it inside the method that
needs it.

Don't create an abstraction whose only job is to hold the _result_ of some other abstraction. It has
a recognisable signature: `createAbstraction<T>("SomethingModel")` with **no implementation**,
populated from elsewhere with `registerInstance`. Resolving it builds nothing; it just reads what
some earlier step deposited. That is a scheduling dependency wearing a DI costume, and it forces a
per-request hook to exist purely to do the depositing.

```ts
// Bad — an abstraction that only holds a value someone else must put there first.
export const FileModel = createAbstraction<CmsModel>("FileModel");

// ...somewhere else, in a hook that MUST run before anything resolves FileModel:
const model = await getModel.execute(FILE_MODEL_ID);
container.registerInstance(FileModel, model.value);
```

```ts
// Bad — the consumer now depends on that hook having already run.
class GetFileUseCaseImpl {
  constructor(
    private fileModel: FileModel.Interface,
    private getEntryById: GetEntryByIdUseCase.Interface
  ) {}

  async execute(id: string) {
    return this.getEntryById.execute(this.fileModel, `${id}#0001`);
  }
}
```

```ts
// Good — a real implementation that fetches on demand.
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
// Good — the consumer awaits it where it already had an async method.
class GetFileUseCaseImpl {
  constructor(
    private fileModelProvider: FileModelProvider.Interface,
    private getEntryById: GetEntryByIdUseCase.Interface
  ) {}

  async execute(id: string) {
    const fileModel = await this.fileModelProvider.get();
    return this.getEntryById.execute(fileModel, `${id}#0001`);
  }
}
```

The reason the bad shape keeps appearing is that constructors cannot await and DI resolution is
synchronous (`resolve<T>(a): T`), so fetching a model up front looks impossible. Methods can await,
and the consumer's methods are already async, so move the async work there.

What you get: the dependency is visible in the constructor, resolution order stops mattering, and
nothing needs a hook to fire at the right moment. Retiring `RequestContextInitializer` took no new
DI machinery — every consumer switching to a provider was enough on its own.

This also applies to picking an implementation based on async configuration. Rather than a hook that
reads a manifest and then registers the right service, inject a lazy implementation that decides
inside its own methods (see `LazySchedulerService`, `LazySharpTransform`).
