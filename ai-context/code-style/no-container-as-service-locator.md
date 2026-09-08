# No Container As A Service Locator

Declare what a class needs in `dependencies` and take it through the constructor. Don't inject
`RequestContainer` (or a `Container`) and call `container.resolve(...)` inside a method — that hides
the real dependencies from the signature, from the DI graph, and from anyone reading the class.

```ts
// Bad
class MyRouteImpl implements HttpRouteHandler.Interface {
  constructor(private container: Container) {}

  async handle(request: IHttpRequest) {
    const prepare = this.container.resolve(PrepareUseCase);
    const ai = this.container.resolve(Ai);
    // ...
  }
}

export const MyRoute = HttpRouteHandler.createImplementation({
  implementation: MyRouteImpl,
  dependencies: [RequestContainer]
});
```

```ts
// Good
class MyRouteImpl implements HttpRouteHandler.Interface {
  constructor(
    private prepare: PrepareUseCase.Interface,
    private ai: Ai.Interface
  ) {}

  async handle(request: IHttpRequest) {
    // ...
  }
}

export const MyRoute = HttpRouteHandler.createImplementation({
  implementation: MyRouteImpl,
  dependencies: [PrepareUseCase, Ai]
});
```

`container.resolve(...)` IS correct in a `createFeature` `resolve()` hook — that hook exists to hand
resolved instances to callers. This rule is about implementation classes.

`HttpRouter` itself takes the container, and that is deliberate: it builds the route that matched,
and only that one. It matches on `HttpRouteDefinition` implementations, which declare no
dependencies of their own — `method`, `path`, and the handler class — so finding a route never
builds one. See `buildHttpRoute`.

Some routes (`AssetDeliveryRoute`, `WebsiteBuilderRedirectsRoute`) still resolve dependencies lazily
inside `handle()`. That was once necessary twice over: route construction ran before the
request-context initializers, so reaching a request-time token threw, and every route was built on
every request whether or not it matched. Neither is true now — those tokens are providers, the
initializers are deleted, and a route is built only once its definition matches. Declare
dependencies instead; don't copy them.
