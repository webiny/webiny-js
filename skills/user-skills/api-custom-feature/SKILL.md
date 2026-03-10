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

## Pattern

```typescript
// extensions/myFeature/MyFeature.ts
import { createFeature, createAbstraction } from "webiny/api";

// 1. Define the interface
export interface IMyService {
    doSomething(): string;
}

// 2. Create the abstraction (DI token)
export const MyService = createAbstraction<IMyService>("MyService");

// 3. Export the interface via namespace (convention for consumers)
export namespace MyService {
    export type Interface = IMyService;
}

// 4. Register the feature (default export)
export default createFeature({
    name: "MyApp/MyFeature",
    register(container) {
        // Register a plain object instance
        container.registerInstance(MyService, {
            doSomething() {
                return "Hello!";
            }
        });
    }
});
```

## Core APIs

### `createAbstraction<T>(name: string)`

Creates a typed DI token (an `Abstraction<T>` instance). The generic `T` is the interface that implementations must satisfy. The `name` string is used for debugging and error messages.

| Import | `import { createAbstraction } from "webiny/api"` |
|---|---|
| Returns | `Abstraction<T>` |
| Usage | Pass to `container.registerInstance()`, `container.register()`, or as a dependency in other extensions |

### `createFeature(def)`

Creates a feature definition that the framework loads as an API extension. Must be the **default export** of the file.

| Import | `import { createFeature } from "webiny/api"` |
|---|---|
| `def.name` | Unique feature name (convention: `"AppName/FeatureName"`) |
| `def.register(container)` | Called at startup with the DI `Container` instance |

### Container Registration Methods

| Method | When to Use |
|---|---|
| `container.registerInstance(abstraction, instance)` | Register a plain object that satisfies the interface |
| `container.register(Implementation)` | Register a class (created via `Abstraction.createImplementation`) |
| `container.registerFactory(abstraction, () => instance)` | Register a lazy factory |

## Extension Registration

Register the feature file using `<Api.Extension>` in your extension's React entry point:

```tsx
// extensions/myFeature/Extension.tsx
import React from "react";
import { Api } from "webiny/extensions";

export const MyFeature = () => {
    return <Api.Extension src={"@/extensions/myFeature/MyFeature.ts"} />;
};
```

Then mount it in `webiny.config.tsx` or your app's extension composition.

## Examples

### Simple Service with Instance Registration

```typescript
// extensions/pricing/PricingFeature.ts
import { createFeature, createAbstraction } from "webiny/api";

export interface IPricingService {
    calculatePrice(basePrice: number, quantity: number): number;
    getDiscount(customerId: string): Promise<number>;
}

export const PricingService = createAbstraction<IPricingService>("PricingService");

export namespace PricingService {
    export type Interface = IPricingService;
}

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

When your service itself needs dependencies, use `createImplementation` on the abstraction and `container.register()`:

```typescript
// extensions/notifications/NotificationFeature.ts
import { createFeature, createAbstraction } from "webiny/api";
import { Logger } from "webiny/api/logger";

export interface INotificationService {
    notify(userId: string, message: string): Promise<void>;
}

export const NotificationService = createAbstraction<INotificationService>("NotificationService");

export namespace NotificationService {
    export type Interface = INotificationService;
}

// Class implementation with injected dependencies
class NotificationServiceImpl implements INotificationService {
    constructor(private logger: Logger.Interface) {}

    async notify(userId: string, message: string) {
        this.logger.info(`Notifying ${userId}: ${message}`);
    }
}

// Attach DI metadata to the class
const NotificationServiceRegistration = NotificationService.createImplementation({
    implementation: NotificationServiceImpl,
    dependencies: [Logger]
});

export default createFeature({
    name: "MyApp/Notifications",
    register(container) {
        container.register(NotificationServiceRegistration);
    }
});
```

## Key Rules

1. **Default export** -- `createFeature()` result must be the default export of the file.
2. **One feature per file** -- each `.ts` file loaded via `<Api.Extension>` should export one feature.
3. **Namespace convention** -- export `namespace MyService { export type Interface = IMyService; }` so consumers can type dependencies as `MyService.Interface`.
4. **Name uniqueness** -- feature names must be globally unique; use `"AppName/FeatureName"` convention.
5. **Constructor param order** -- when using class registration, the `dependencies` array must match constructor parameter order exactly.

## Quick Reference

| What | How |
|---|---|
| Import | `import { createFeature, createAbstraction } from "webiny/api"` |
| Create token | `const MyService = createAbstraction<IMyService>("MyService")` |
| Register instance | `container.registerInstance(MyService, { ... })` |
| Register class | `container.register(MyService.createImplementation({ implementation, dependencies }))` |
| Extension entry | `<Api.Extension src={"@/extensions/myFeature/MyFeature.ts"} />` |
| Deploy | `yarn webiny deploy api --env=dev` |

## Related Skills

- **webiny-dependency-injection** -- Full DI pattern details, all injectable services, decorator and composite patterns
- **webiny-custom-graphql-api** -- How to consume your custom feature's abstraction in a GraphQL schema
- **webiny-project-structure** -- Extension file layout and `webiny.config.tsx` registration
