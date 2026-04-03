---
name: webiny-rest-route
context: webiny-extensions
description: >
  Adding custom REST routes to the API using Api.Route and Route.Interface.
  Use this skill when the developer wants to expose a custom HTTP endpoint (GET, POST, PUT, etc.)
  on the API Gateway alongside the GraphQL handler, implement Route.Interface with full DI support,
  or register a custom REST handler in webiny.config.tsx.
---

# Custom REST Routes

## TL;DR

Add a custom REST route by implementing `Route.Interface` and registering it with `<Api.Route>` in `webiny.config.tsx`. The `path` and `method` props configure API Gateway and Fastify route registration. Your handler receives a framework-agnostic `Route.Request` and `Route.Reply` and supports full DI (Logger, BuildParams, UseCases, etc.).

**YOU MUST include the full file path with the `.ts` extension in the `src` prop.** For example, use `src={"/extensions/MyRoute.ts"}`, NOT `src={"/extensions/MyRoute"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by a `src` prop. Named exports cause build failures here.

## The Route Pattern

```typescript
// extensions/MyRoute.ts
import { Route } from "webiny/api/route";
import { Logger } from "webiny/api/logger";
import { BuildParams } from "webiny/api/build-params";

class MyRouteImpl implements Route.Interface {
  constructor(
    private logger: Logger.Interface,
    private buildParams: BuildParams.Interface
  ) {}

  async execute(request: Route.Request, reply: Route.Reply): Promise<void> {
    this.logger.info("Handling request", { url: request.url });

    const config = this.buildParams.get<string>("MY_CONFIG");

    reply.code(200).send({ status: "ok", config });
  }
}

export default Route.createImplementation({
  implementation: MyRouteImpl,
  dependencies: [Logger, BuildParams]
});
```

Register in `webiny.config.tsx`:

```tsx
<Api.Route method={"POST"} path={"/my-route"} src={"/extensions/MyRoute.ts"} />
```

## Props Reference

| Prop        | Type     | Required | Description                                                                 |
| ----------- | -------- | -------- | --------------------------------------------------------------------------- |
| `path`      | `string` | Yes      | Route path — must start with `/`                                            |
| `method`    | `string` | Yes      | HTTP method (see list below)                                                |
| `src`       | `string` | Yes      | Path to the handler file (must include `.ts` extension)                     |
| `routeName` | `string` | No       | Pulumi resource name (kebab-case). Auto-derived from path+method if omitted |

## Supported HTTP Methods

`DELETE`, `GET`, `HEAD`, `PATCH`, `POST`, `PUT`, `OPTIONS`, `ANY`

Use `ANY` to match all HTTP methods on a given path.

## Route.Request / Route.Reply Interfaces

These are framework-agnostic — no Fastify types leak into user code.

### `Route.Request`

```ts
interface Route.Request {
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    params: unknown;   // path parameters, e.g. { id: "abc" }
    query: unknown;    // query string parameters
}
```

### `Route.Reply`

```ts
interface Route.Reply {
    code(statusCode: number): this;   // set HTTP status code
    send(data?: unknown): void;       // send response body
    header(key: string, value: unknown): this;
}
```

Chaining example:

```ts
reply.code(201).header("X-Custom", "value").send({ created: true });
```

## How It Works

The `<Api.Route>` extension does two things at build/deploy time:

1. **Build time** — injects two entries into `apps/api/graphql/src/extensions.ts`:

   - A `createContextPlugin` that registers your handler in the DI container
   - A `createRoute` that registers the Fastify route with the hardcoded `path` and `method`

2. **Deploy time (Pulumi)** — calls `graphql.addRoute({ name, path, method })` on the `ApiGraphql` module to create the API Gateway route

At request time, the handler is resolved from the DI container — so all `dependencies` (Logger, BuildParams, UseCases, etc.) are fully injected.

## Example with Path Parameters

```typescript
// extensions/GetOrderRoute.ts
import { Route } from "webiny/api/route";
import { Logger } from "webiny/api/logger";

interface OrderParams {
  orderId: string;
}

class GetOrderRouteImpl implements Route.Interface {
  constructor(private logger: Logger.Interface) {}

  async execute(request: Route.Request, reply: Route.Reply): Promise<void> {
    const { orderId } = request.params as OrderParams;
    this.logger.info("Fetching order", { orderId });

    // ... fetch and return order
    reply.code(200).send({ orderId, status: "fulfilled" });
  }
}

export default Route.createImplementation({
  implementation: GetOrderRouteImpl,
  dependencies: [Logger]
});
```

```tsx
<Api.Route method={"GET"} path={"/orders/{orderId}"} src={"/extensions/GetOrderRoute.ts"} />
```

## Key Rules

- **`path` and `method` are hardcoded at build time** — the Fastify route is registered before any request arrives. Your handler does not need to specify them.
- **DI is fully available in `execute()`** — the handler instance is resolved from the container per request, so all dependencies are injected normally.
- **One handler per file** — each `src` file exports one `Route.createImplementation` result.
- **Constructor param order must match the `dependencies` array** exactly.
- **Use `.js` extensions** in all relative imports inside the handler file (ESM).
- **Do not read `process.env`** at runtime — use `BuildParams` for configuration instead.

## Quick Reference

```
Import (handler):  import { Route } from "webiny/api/route";
Interface:         Route.Interface
Request type:      Route.Request
Reply type:        Route.Reply
Export:            Route.createImplementation({ implementation, dependencies })
Register:          <Api.Route method={"POST"} path={"/my-route"} src={"/extensions/MyRoute.ts"} />
Deploy:            yarn webiny deploy api --env=dev
```

## Related Skills

- **webiny-api-architect** — DI patterns, Services, UseCases, feature organization
- **webiny-custom-graphql-api** — Custom GraphQL endpoints (alternative to REST)
- **webiny-dependency-injection** — Injectable services catalog (Logger, BuildParams, etc.)
- **webiny-infrastructure-extensions** — Pulumi-level infrastructure customization
