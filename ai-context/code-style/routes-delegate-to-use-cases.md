# Routes Delegate To Use Cases

An `HttpRoute` is transport, not feature code. Its job is to parse the request, call one use case, and
map the outcome onto a status code. Business logic — auth checks, orchestration, calls to other
services — belongs in a use case behind its own abstraction, so it can be resolved, decorated and
tested without an HTTP request.

```ts
// Good
class CreateThingRouteImpl implements HttpRoute.Interface {
  public readonly method = "POST";
  public readonly path = "/things";

  public constructor(private readonly createThing: CreateThingUseCase.Interface) {}

  public async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const params = parseBody(request.body);
    if (!params) {
      return json(400, { error: "Invalid body." });
    }
    return json(200, await this.createThing.execute(params));
  }
}
```

```ts
// Bad — the feature lives in the route, so nothing else can reuse or test it
class CreateThingRouteImpl implements HttpRoute.Interface {
  public async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const identity = this.identityContext.getIdentity();
    if (identity.isAnonymous()) {
      return json(401, { error: "Authentication required." });
    }
    const validated = validate(request.body);
    const created = await this.repository.create(validated);
    await this.eventPublisher.publish(new ThingCreatedEvent(created));
    return json(200, created);
  }
}
```
