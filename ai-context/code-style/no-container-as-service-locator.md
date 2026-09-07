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

`HttpRouter` itself takes the container, and that is now only about cost: it resolves routes inside
`route()` so it doesn't construct all of them to match one path. The original reason was stronger —
construction used to happen before the request-context initializers ran, so a route reaching a
request-time token (`FileModel`, a per-request `CmsModel`) threw "No registration found" on every
request. Those tokens are providers with real implementations now and the initializers are gone, so
that hazard no longer exists.

Some routes (`AssetDeliveryRoute`, `WebsiteBuilderRedirectsRoute`) still resolve lazily inside
`handle()` as a leftover of that old constraint. They no longer need to — don't copy them.
