---
name: webiny-api-custom-feature
context: webiny-extensions
description: >
  Creating custom API features with createFeature and createAbstraction.
  Use this skill when the developer wants to define a new backend service,
  register an abstraction in the DI container, create a reusable API module,
  or wire up custom business logic as a Webiny feature. Covers the full pattern:
  define an interface, create an abstraction token, implement and register
  via createFeature, and register the extension in webiny.config.tsx.
---

# Custom API Features

## TL;DR

Use `createFeature` and `createAbstraction` from `"webiny/api"` to define reusable backend services. An abstraction is a DI token typed to an interface. A feature registers concrete implementations into the DI container. Other extensions (GraphQL schemas, lifecycle hooks, etc.) can then declare the abstraction as a dependency and receive the implementation automatically.

> **Always prefer building new functionality as a custom feature/abstraction — even for simple one-off use cases.** Inline logic in EventHandlers, GraphQL resolvers, or CLI commands cannot be reused, tested in isolation, or swapped. A service wrapped in `createAbstraction` + `createFeature` is injectable everywhere and replaceable without changing callers.

## Folder Structure (MANDATORY)

Every feature MUST live in its own folder under `features/` within the extension directory. Follow these conventions based on complexity:

### Simple feature (single service or event handler)

```
extensions/myExtension/
├── Extension.tsx                          # Registers all Api.Extension entries
└── features/
    └── slackService/
        ├── abstractions.ts                # Interface + createAbstraction token
        ├── feature.ts                     # createFeature definition
        └── SlackService.ts                # Implementation class
```

### Feature with multiple abstractions in the same domain

```
extensions/myExtension/
├── Extension.tsx
└── features/
    └── notifications/
        ├── abstractions.ts                # All related interfaces + tokens
        ├── feature.ts                     # createFeature registers all abstractions
        ├── SlackNotifier.ts               # Implementation of one abstraction
        └── EmailNotifier.ts               # Implementation of another
```

### Extension with multiple domains

When an extension spans multiple domains, nest by `features/{domain}/{service}/`:

```
extensions/myExtension/
├── Extension.tsx
└── features/
    ├── notifications/
    │   └── slack/
    │       ├── abstractions.ts
    │       ├── feature.ts
    │       └── SlackService.ts
    └── analytics/
        └── tracking/
            ├── abstractions.ts
            ├── feature.ts
            └── TrackingService.ts
```

This mirrors the platform's own structure (see `packages/api-core/src/features/` for reference):

- `features/logger/` — simple: `abstractions.ts`, `feature.ts`, `LoggerService.ts`
- `features/keyValueStore/` — multiple abstractions in one domain
- `features/security/apiKeys/CreateApiKey/` — multi-domain with nested services

### Key file responsibilities

| File              | Purpose                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `abstractions.ts` | Interface definitions, `createAbstraction` tokens, namespace exports. No implementation logic. |
| `feature.ts`      | `createFeature` definition that registers abstractions into the container. Default export.     |
| `{ClassName}.ts`  | Implementation class with `createImplementation`. One class per file.                          |

## Pattern

```typescript
// extensions/myExtension/features/myService/abstractions.ts
import { createAbstraction } from "webiny/api";

export interface IMyService {
  doSomething(): string;
}

export const MyService = createAbstraction<IMyService>("MyService");

export namespace MyService {
  export type Interface = IMyService;
}
```

```typescript
// extensions/myExtension/features/myService/MyServiceImpl.ts
import { MyService } from "./abstractions.js";

class MyServiceImpl implements MyService.Interface {
  doSomething() {
    return "Hello!";
  }
}

export const MyServiceRegistration = MyService.createImplementation({
  implementation: MyServiceImpl,
  dependencies: []
});
```

```typescript
// extensions/myExtension/features/myService/feature.ts
import { createFeature } from "webiny/api";
import { MyServiceRegistration } from "./MyServiceImpl.js";

export default createFeature({
  name: "MyApp/MyService",
  register(container) {
    container.register(MyServiceRegistration);
  }
});
```

## Core APIs

### `createAbstraction<T>(name: string)`

Creates a typed DI token (an `Abstraction<T>` instance). The generic `T` is the interface that implementations must satisfy. The `name` string is used for debugging and error messages.

| Import  | `import { createAbstraction } from "webiny/api"`                                                       |
| ------- | ------------------------------------------------------------------------------------------------------ |
| Returns | `Abstraction<T>`                                                                                       |
| Usage   | Pass to `container.registerInstance()`, `container.register()`, or as a dependency in other extensions |

### `createFeature(def)`

Creates a feature definition that the framework loads as an API extension. Must be the **default export** of the file.

| Import                    | `import { createFeature } from "webiny/api"`              |
| ------------------------- | --------------------------------------------------------- |
| `def.name`                | Unique feature name (convention: `"AppName/FeatureName"`) |
| `def.register(container)` | Called at startup with the DI `Container` instance        |

### Container Registration Methods

| Method                                                   | When to Use                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `container.registerInstance(abstraction, instance)`      | Register a plain object that satisfies the interface              |
| `container.register(Implementation)`                     | Register a class (created via `Abstraction.createImplementation`) |
| `container.registerFactory(abstraction, () => instance)` | Register a lazy factory                                           |

## Extension Registration

Register each `feature.ts` file using `<Api.Extension>` in your extension's React entry point.

### Build Parameters — The ONLY Way to Pass Configuration (MANDATORY)

**A deployed API must NEVER use `process.env` to read configuration.** All configuration parameters must flow through `BuildParams`. This is a core architectural rule: `process.env` is only read at build time in `webiny.config.tsx`, and the values are baked into the bundle via `<Api.BuildParam>`. At runtime, your services receive configuration by declaring `BuildParams` as a dependency and calling `buildParams.get<T>("PARAM_NAME")`.

**Why:** Webiny APIs are bundled and deployed as Lambda functions. Environment variables set on the Lambda are reserved for Webiny internals. Extension configuration must be injected at build time via `BuildParams` so that values are deterministic, typed, and testable. Using `process.env` at runtime bypasses the DI system, is untestable, and couples your code to the deployment environment.

**`<Api.BuildParam>` declarations MUST live inside the extension's `Extension.tsx`, NOT in `webiny.config.tsx`.** Required parameters are exposed as React props on the extension component. The consumer in `webiny.config.tsx` decides where the value comes from (env var, hardcoded, config, etc.).

#### How it works

1. **`webiny.config.tsx`** — reads `process.env` at **build time** and passes values as React props.
2. **`Extension.tsx`** — declares `<Api.BuildParam>` entries that bake those values into the deployed bundle.
3. **Your service** — declares `BuildParams` as a DI dependency and calls `buildParams.get<T>(key)` at **runtime**.

```tsx
// extensions/myExtension/Extension.tsx
import React from "react";
import { Api } from "webiny/extensions";

interface MyExtensionProps {
  apiEndpoint: string;
  secretKey: string;
}

export const MyExtension = ({ apiEndpoint, secretKey }: MyExtensionProps) => {
  return (
    <>
      <Api.BuildParam paramName="MY_API_ENDPOINT" value={apiEndpoint} />
      <Api.BuildParam paramName="MY_SECRET_KEY" value={secretKey} />
      <Api.Extension src={"@/extensions/myExtension/features/myService/feature.ts"} />
      <Api.Extension src={"@/extensions/myExtension/features/myHandler/feature.ts"} />
    </>
  );
};
```

```tsx
// webiny.config.tsx — the ONLY place where process.env is read
<MyExtension
  apiEndpoint={process.env.MY_API_ENDPOINT || ""}
  secretKey={process.env.MY_SECRET_KEY || ""}
/>
```

```typescript
// Inside your service — use BuildParams, NEVER process.env
import { BuildParams } from "webiny/api/build-params";

class MyServiceImpl implements MyService.Interface {
  constructor(private buildParams: BuildParams.Interface) {}

  doSomething() {
    // buildParams.get() returns T | null — always handle null
    const endpoint = this.buildParams.get<string>("MY_API_ENDPOINT");
    if (!endpoint) {
      throw new Error("MY_API_ENDPOINT build param is not configured.");
    }
    // use endpoint...
  }
}

export const MyServiceRegistration = MyService.createImplementation({
  implementation: MyServiceImpl,
  dependencies: [BuildParams]
});
```

#### WRONG — never do this in a deployed service

```typescript
// ❌ WRONG: reading process.env at runtime in an API service
class MyServiceImpl implements MyService.Interface {
  doSomething() {
    const endpoint = process.env.MY_API_ENDPOINT; // ❌ DO NOT DO THIS
  }
}
```

This keeps extensions self-contained and reusable — all required configuration is declared in one place via typed props, and all runtime access goes through the DI container.

## Examples

### Simple Service with Instance Registration

```typescript
// extensions/pricing/features/pricingService/abstractions.ts
import { createAbstraction } from "webiny/api";

export interface IPricingService {
  calculatePrice(basePrice: number, quantity: number): number;
  getDiscount(customerId: string): Promise<number>;
}

export const PricingService = createAbstraction<IPricingService>("PricingService");

export namespace PricingService {
  export type Interface = IPricingService;
}
```

```typescript
// extensions/pricing/features/pricingService/feature.ts
import { createFeature } from "webiny/api";
import { PricingService } from "./abstractions.js";

export default createFeature({
  name: "MyApp/Pricing",
  register(container) {
    container.registerInstance(PricingService, {
      calculatePrice(basePrice, quantity) {
        return basePrice * quantity;
      },
      async getDiscount(_customerId) {
        return 0.1; // 10% default discount
      }
    });
  }
});
```

### Service with Class Registration and Dependencies

When your service needs dependencies, create a separate implementation file:

```typescript
// extensions/notifications/features/notificationService/abstractions.ts
import { createAbstraction } from "webiny/api";

export interface INotificationService {
  notify(userId: string, message: string): Promise<void>;
}

export const NotificationService = createAbstraction<INotificationService>("NotificationService");

export namespace NotificationService {
  export type Interface = INotificationService;
}
```

```typescript
// extensions/notifications/features/notificationService/NotificationServiceImpl.ts
import { Logger } from "webiny/api/logger";
import { NotificationService } from "./abstractions.js";

class NotificationServiceImpl implements NotificationService.Interface {
  constructor(private logger: Logger.Interface) {}

  async notify(userId: string, message: string) {
    this.logger.info(`Notifying ${userId}: ${message}`);
  }
}

export const NotificationServiceRegistration = NotificationService.createImplementation({
  implementation: NotificationServiceImpl,
  dependencies: [Logger]
});
```

```typescript
// extensions/notifications/features/notificationService/feature.ts
import { createFeature } from "webiny/api";
import { NotificationServiceRegistration } from "./NotificationServiceImpl.js";

export default createFeature({
  name: "MyApp/Notifications",
  register(container) {
    container.register(NotificationServiceRegistration);
  }
});
```

## Key Rules

1. **Abstractions first (MANDATORY)** -- Any new business logic MUST be encapsulated in a `createAbstraction` + `createFeature`. Never put logic directly in an EventHandler, GraphQL resolver, or CLI command. Those are thin orchestrators that inject and call your service.
2. **Default export** -- `createFeature()` result must be the default export of the file.
3. **One feature per file** -- each `.ts` file loaded via `<Api.Extension>` should export one feature.
4. **Namespace convention** -- export `namespace MyService { export type Interface = IMyService; }` so consumers can type dependencies as `MyService.Interface`.
5. **Name uniqueness** -- feature names must be globally unique; use `"AppName/FeatureName"` convention.
6. **Constructor param order** -- when using class registration, the `dependencies` array must match constructor parameter order exactly.
7. **No `process.env` at runtime** -- deployed API services must NEVER read `process.env`. All configuration flows through `BuildParams`. `process.env` is only read at build time in `webiny.config.tsx`.

## Quick Reference

| What                  | How                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------- |
| Abstractions          | `features/{name}/abstractions.ts` — interfaces + `createAbstraction` tokens            |
| Feature               | `features/{name}/feature.ts` — `createFeature` with container registrations            |
| Implementation        | `features/{name}/{ClassName}.ts` — class + `createImplementation`                      |
| Import                | `import { createFeature, createAbstraction } from "webiny/api"`                        |
| Create token          | `const MyService = createAbstraction<IMyService>("MyService")`                         |
| Register instance     | `container.registerInstance(MyService, { ... })`                                       |
| Register class        | `container.register(MyService.createImplementation({ implementation, dependencies }))` |
| Extension entry       | `<Api.Extension src={"@/extensions/myExtension/features/{name}/feature.ts"} />`        |
| Build param (declare) | `<Api.BuildParam paramName="KEY" value={prop} />` in `Extension.tsx`                   |
| Build param (read)    | `buildParams.get<T>("KEY")` — returns `T \| null`, always handle null                  |
| Build param (import)  | `import { BuildParams } from "webiny/api/build-params"`                                |
| Deploy                | `yarn webiny deploy api --env=dev`                                                     |

## Related Skills

- **webiny-dependency-injection** -- Full DI pattern details, all injectable services, decorator and composite patterns
- **webiny-custom-graphql-api** -- How to consume your custom feature's abstraction in a GraphQL schema
- **webiny-project-structure** -- Extension file layout and `webiny.config.tsx` registration
