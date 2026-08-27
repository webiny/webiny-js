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

Some existing routes (`AssetDeliveryRoute`, `WebsiteBuilderRedirectsRoute`) still resolve lazily to
work around `HttpRouter` constructing every registered route on each request just to path-match. That
is a documented TODO on `HttpRouterImplClass`, not a pattern to copy — the fix belongs in the router.
