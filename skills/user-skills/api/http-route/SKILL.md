---
name: webiny-http-route
description: >
  Adding custom HTTP routes to the API with <Api.Route> and HttpRouteHandler.
  Use this skill when the developer wants to expose a custom HTTP endpoint (GET, POST, PUT, etc.)
  on the API alongside the GraphQL handler, implement a route handler with full DI support,
  or register a custom HTTP route in webiny.config.tsx.
---

# Custom HTTP Routes

## TL;DR

Write a handler that implements `HttpRouteHandler.Interface`, then point `<Api.Route>` at it in
`webiny.config.tsx`. The `method` and `path` props configure both the API Gateway route and the
router, so the handler file never restates them. Handlers get full DI.

**YOU MUST include the full file path with the `.ts` extension in the `src` prop.** Use
`src={"/extensions/MyRoute.ts"}`, not `src={"/extensions/MyRoute"}`. Omitting it fails the build.

**YOU MUST use `export default`** for the `createImplementation()` call. Named exports fail here.

## The route pattern

```typescript
// extensions/MyRoute.ts
import { HttpRouteHandler, Logger } from "webiny/api";

class MyRouteImpl implements HttpRouteHandler.Interface {
  constructor(private logger: Logger.Interface) {}

  async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
    this.logger.info({ path: request.path }, "Handling request");

    return response.status(200).json({ status: "ok" });
  }
}

export default HttpRouteHandler.createImplementation({
  implementation: MyRouteImpl,
  dependencies: [Logger]
});
```

Register it:

```tsx
<Api.Route method={"POST"} path={"/my-route"} src={"/extensions/MyRoute.ts"} />
```

## Props reference

| Prop        | Type     | Required | Description                                                                                                                           |
| ----------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `path`      | `string` | Yes      | Route path — must start with `/`                                                                                                      |
| `method`    | `string` | Yes      | HTTP method (see below)                                                                                                               |
| `src`       | `string` | Yes      | Path to the handler file (must include `.ts`)                                                                                         |
| `routeName` | `string` | No       | Route name (kebab-case). Derived from path + method if omitted. Doubles as the Pulumi resource name and the id a decorator matches on |

Methods: `DELETE`, `GET`, `HEAD`, `PATCH`, `POST`, `PUT`, `OPTIONS`, `ANY`. Use `ANY` to match every
method on a path.

## Path parameters

Write them either way. `{orderId}` is API Gateway syntax, `:orderId` is the router's; the extension
converts to whichever each consumer needs, so both work and mean the same thing.

```tsx
<Api.Route method={"GET"} path={"/orders/{orderId}"} src={"/extensions/GetOrderRoute.ts"} />
<Api.Route method={"GET"} path={"/orders/:orderId"} src={"/extensions/GetOrderRoute.ts"} />
```

Read them off `request.pathParameters`:

```typescript
class GetOrderRouteImpl implements HttpRouteHandler.Interface {
  constructor(private getOrder: GetOrderUseCase.Interface) {}

  async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
    const order = await this.getOrder.execute(request.pathParameters.orderId);

    return response.status(200).json(order);
  }
}

export default HttpRouteHandler.createImplementation({
  implementation: GetOrderRouteImpl,
  dependencies: [GetOrderUseCase]
});
```

Wildcards are the exception: `/files/*` matches for the router, `{proxy+}` for API Gateway, and they
capture differently. Write a wildcard route for the target you mean.

## Request

`HttpRouteHandler.Request` is transport-agnostic — no API Gateway or Node types leak into your code.

```ts
interface Request {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  pathParameters: Record<string, string>;
  body: any;
}
```

## Response

`HttpRouteHandler.Response` is a mutable builder, the `res` of an Express-style handler. Every method
returns `this`, so calls chain:

| Method                          | Purpose                               |
| ------------------------------- | ------------------------------------- |
| `status(code)`                  | Set the status code (defaults to 200) |
| `json(body)`                    | JSON body + content type              |
| `text(body)`                    | Plain-text body                       |
| `send(body)`                    | Body as-is                            |
| `header(name, value)`           | Set one header                        |
| `getHeader(name)`               | Read a header already set             |
| `cookie(name, value, options?)` | Set a cookie                          |
| `clearCookie(name, options?)`   | Expire a cookie                       |
| `redirect(url, statusCode?)`    | Redirect                              |
| `sse(source)`                   | Server-sent events stream             |

```ts
return response.status(201).cookie("sid", id, { httpOnly: true }).json({ id });
```

Returning the builder is optional — mutate it and return nothing for the same result. Returning a
plain object works too; anything set on the builder is merged underneath it, and the returned object
wins on conflicts.

`cookie`'s `maxAge` is in **seconds** (the `Max-Age` attribute), unlike Express, which uses
milliseconds.

## How it works

`<Api.Route>` does two things:

1. **Build time** — writes a registration into `apps/api/graphql/src/extensions.ts` that registers an
   `HttpRouteDefinition` built from your `method` and `path`, pointing at your handler.
2. **Deploy time** — calls `addRoute({ name, path, method })` on the API Pulumi module to create the
   API Gateway route, with the path converted to `{param}` syntax.

At request time the router matches the definition (cheap — it holds only `method`, `path` and the
handler class) and builds your handler only then, with its dependencies injected. A route your
request didn't match is never constructed.

## Decorating a route

Decorate `HttpRouteDefinition` and match on `name` — the router resolves definitions, so your
decorator sees every route in turn and decides which to change. `name` is `routeName`, or the value
derived from path and method (`/my-route` + `GET` → `my-route-get`).

```typescript
import { HttpRouteDefinition } from "webiny/api";

export default HttpRouteDefinition.createDecorator({
  decorator: class implements HttpRouteDefinition.Interface {
    constructor(private decoratee: HttpRouteDefinition.Interface) {}

    get name() {
      return this.decoratee.name;
    }
    get method() {
      return this.decoratee.method;
    }
    get path() {
      return this.decoratee.path;
    }

    get handler() {
      return this.decoratee.name === "my-route-get" ? MyReplacementRoute : this.decoratee.handler;
    }
  },
  dependencies: []
});
```

Decorating the definition, not the handler: the router builds a matched route's class directly
rather than resolving `HttpRouteHandler`, which is what stops unmatched routes being built. A
decorator on `HttpRouteHandler` therefore reaches nothing.

To change what a route DOES rather than replace it, return a wrapper as the `handler` and let it
build the original:

```typescript
import { HttpRouteHandler, RequestContainer, buildHttpRoute } from "webiny/api";

get handler() {
  if (this.decoratee.name !== "my-route-get") { return this.decoratee.handler; }

  const inner = this.decoratee.handler;

  class Wrapper implements HttpRouteHandler.Interface {
    constructor(private container: Container) {}

    async handle(request, response) {
      // before
      const result = await buildHttpRoute(this.container, inner).handle(request, response);
      // after
      return result;
    }
  }

  return HttpRouteHandler.createImplementation({
    implementation: Wrapper,
    dependencies: [RequestContainer]
  });
}
```

The wrapper takes `RequestContainer` because it can't know the wrapped route's dependencies. That's
the one case where reaching for the container is the right answer.

## Key rules

- **Do not declare `method`/`path` in the handler file.** They come from the props. A handler that
  sets its own would be ignored, and the two could disagree.
- **Export the handler, not a definition.** `<Api.Route>` builds the definition for you.
- **Constructor parameter order must match the `dependencies` array** exactly.
- **Declare dependencies; don't inject the container** and resolve inside `handle()`.
- **One handler per file** — each `src` file default-exports one implementation.
- **Use `.js` extensions** in relative imports (ESM).
- **Do not read `process.env`** at runtime; use `BuildParams`.
- **No `console.*`** in API code — inject `Logger`.

## Quick reference

```
Import:      import { HttpRouteHandler } from "webiny/api";
Interface:   HttpRouteHandler.Interface
Request:     HttpRouteHandler.Request
Response:    HttpRouteHandler.Response
Export:      export default HttpRouteHandler.createImplementation({ implementation, dependencies })
Register:    <Api.Route method={"POST"} path={"/my-route"} src={"/extensions/MyRoute.ts"} />
Deploy:      yarn webiny deploy api --env=dev
```

## Related skills

- **webiny-api-architect** — DI patterns, services, use cases, feature organization
- **webiny-custom-graphql-api** — custom GraphQL endpoints (alternative to HTTP)
- **webiny-dependency-injection** — injectable services catalog (Logger, BuildParams, etc.)
- **webiny-infrastructure-extensions** — Pulumi-level infrastructure customization
