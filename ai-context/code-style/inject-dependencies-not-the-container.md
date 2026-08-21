# Inject Dependencies, Not The Container

Declare the abstractions a class actually needs in its `dependencies` array. Never inject a container
(e.g. `RequestContainer`) to resolve things later — that hides the dependency graph, defeats
compile-time checking, and turns a missing registration into a runtime failure deep inside a method.

```ts
// Good
class ThingUseCaseImpl implements ThingUseCase.Interface {
  public constructor(
    private readonly repository: ThingRepository.Interface,
    private readonly logger: Logger.Interface
  ) {}
}

export const ThingUseCase = Abstraction.createImplementation({
  implementation: ThingUseCaseImpl,
  dependencies: [ThingRepository, Logger]
});
```

```ts
// Bad
class ThingUseCaseImpl implements ThingUseCase.Interface {
  public constructor(private readonly container: Container) {}

  async execute() {
    const repository = this.container.resolve(ThingRepository);
  }
}

export const ThingUseCase = Abstraction.createImplementation({
  implementation: ThingUseCaseImpl,
  dependencies: [RequestContainer]
});
```

Note: some existing routes inject `RequestContainer` to work around `HttpRouter` constructing every
registered route on each request. That is a known issue in `HttpRouter`, not a pattern to copy — fix
the router rather than spreading the workaround.
