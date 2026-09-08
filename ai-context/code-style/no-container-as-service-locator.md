# No Container As A Service Locator

Declare what a class needs in `dependencies` and take it through the constructor. Don't inject
`RequestContainer` (or a `Container`) and call `container.resolve(...)` inside a method — that hides
the real dependencies from the signature, from the DI graph, and from anyone reading the class.

```ts
// Bad
class MyRouteImpl implements HttpRoute.Interface {
  constructor(private container: Container) {}

  async handle(request: IHttpRequest) {
    const prepare = this.container.resolve(PrepareUseCase);
    const ai = this.container.resolve(Ai);
    // ...
  }
}

export const MyRoute = HttpRoute.createImplementation({
  implementation: MyRouteImpl,
  dependencies: [RequestContainer]
});
```

```ts
// Good
class MyRouteImpl implements HttpRoute.Interface {
  constructor(
    private prepare: PrepareUseCase.Interface,
    private ai: Ai.Interface
  ) {}

  async handle(request: IHttpRequest) {
    // ...
  }
}

export const MyRoute = HttpRoute.createImplementation({
  implementation: MyRouteImpl,
  dependencies: [PrepareUseCase, Ai]
});
```

`container.resolve(...)` IS correct in a `createFeature` `resolve()` hook — that hook exists to hand
resolved instances to callers. This rule is about implementation classes.

`HttpRouter` itself takes the container, and that is deliberate: it resolves the route that matched,
and only that one. Route definitions are plain data (`method`, `path`, and the handler's
abstraction), so matching builds nothing; see `createHttpRoute`.

Some routes (`AssetDeliveryRoute`, `WebsiteBuilderRedirectsRoute`) still resolve dependencies lazily
inside `handle()`, left over from when route construction ran before the request-context
initializers and reaching a request-time token threw. Both of those reasons are gone — the tokens
are providers and the initializers are deleted — so declare dependencies instead; don't copy them.
