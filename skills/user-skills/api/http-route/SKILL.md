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
  /** Which route matched — `{ name, method, path }`. */
  route: MatchedRouteDefinition;
}
```

`route` is what makes a decorator able to act on one route (see below), and lets a handler read its
own identity. `method`/`path` on it are the route's PATTERN (`/orders/:orderId`), where the
top-level `method`/`path` are the request's actual values (`/orders/abc123`).

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

Two hooks, both ordinary DI decorators.

### Change what a route DOES

Decorate `HttpRouteHandler`. It applies to every route, and `request.route.name` picks the one you
mean:

```typescript
import { HttpRouteHandler } from "webiny/api";

export default HttpRouteHandler.createDecorator({
  decorator: class implements HttpRouteHandler.Interface {
    constructor(private decoratee: HttpRouteHandler.Interface) {}

    async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
      if (request.route.name !== "my-route-get") {
        return this.decoratee.handle(request, response);
      }

      if (request.headers["x-api-key"] !== "expected") {
        return response.status(401).json({ message: "Not authorized." });
      }

      return this.decoratee.handle(request, response);
    }
  },
  dependencies: []
});
```

Drop the `name` check and it wraps every route, which is what you want for timing or logging.

`request.route` is `{ name, method, path }` of the matched route. `name` is `routeName`, or the
value derived from path and method (`/my-route` + `GET` → `my-route-get`). A route can read it to
find out its own identity too.

### Change what a route IS

Decorate `HttpRouteDefinition` when you need to alter the route itself — point it at a different
handler, or move its path:

```typescript
import { HttpRouteDefinition } from "webiny/api";

export default HttpRouteDefinition.createDecorator({
  decorator: class implements HttpRouteDefinition.Interface {
    readonly name: string;
    readonly method: string;
    readonly path: string;
    readonly handler: HttpRouteDefinition.Interface["handler"];

    constructor(decoratee: HttpRouteDefinition.Interface) {
      this.name = decoratee.name;
      this.method = decoratee.method;
      this.path = decoratee.name === "my-route-get" ? "/moved" : decoratee.path;
      this.handler = decoratee.handler;
    }
  },
  dependencies: []
});
```

A decorator exposes the same properties as what it wraps, so it copies through the ones it doesn't
change. Getters work too if you prefer them — these are plain properties, not methods.

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
