---
name: webiny-api-architect
context: webiny-extensions
description: >
  API-side architecture patterns for Webiny extensions. Use this skill when building
  backend features with createFeature, createAbstraction, UseCase/Repository layering,
  container registration, and API BuildParams. Covers the api/ directory structure
  and DI scoping rules for API extensions.
---

# API Architecture Patterns

## TL;DR

API extensions use `createFeature` from `webiny/api` to register domain models, GraphQL schemas, and features into the DI container. Each feature is self-contained in its own directory with abstractions, implementations, and a `feature.ts` registration file. The layering is **UseCase → Repository**, with use cases as transient and repositories as singletons.

## API Directory Structure

```
api/
├── Extension.ts          # API entry point (createFeature)
├── domain/               # Domain models, errors, value objects
├── features/             # One directory per use case
│   └── CreateThing/
│       ├── abstractions.ts
│       ├── CreateThingUseCase.ts
│       ├── CreateThingRepository.ts
│       └── feature.ts
└── graphql/              # GraphQL schema definitions
    └── CreateThingSchema.ts
```

## API Extension Entry Point

The API entry point uses `createFeature` to register all backend components into the DI container:

```ts
// src/api/Extension.ts
import { createFeature } from "webiny/api";
import MyModel from "./domain/MyModel.js";
import CreateThingSchema from "./graphql/CreateThingSchema.js";
import { CreateThingFeature } from "./features/CreateThing/feature.js";
import { GetThingFeature } from "./features/GetThing/feature.js";

export const Extension = createFeature({
  name: "MyExtension",
  register(container) {
    // Domain models (CMS content models, etc.)
    container.register(MyModel);

    // GraphQL schemas
    container.register(CreateThingSchema);

    // Features (use cases + repositories)
    CreateThingFeature.register(container);
    GetThingFeature.register(container);
  }
});
```

## Abstractions

Every piece of business logic starts with a typed abstraction token:

```ts
// src/api/features/CreateThing/abstractions.ts
import { createAbstraction, Result } from "webiny/api";
import type { MyEntity } from "~/shared/MyEntity.js";

export interface ICreateThingInput {
  name: string;
}

export interface ICreateThingUseCase {
  execute(input: ICreateThingInput): Promise<Result<MyEntity, Error>>;
}

export const CreateThingUseCase = createAbstraction<ICreateThingUseCase>(
  "MyExtension/CreateThingUseCase"
);

// Namespace re-exports all related types for convenient access
export namespace CreateThingUseCase {
  export type Interface = ICreateThingUseCase;
  export type Input = ICreateThingInput;
}

export interface ICreateThingRepository {
  execute(entity: MyEntity): Promise<Result<MyEntity, Error>>;
}

export const CreateThingRepository = createAbstraction<ICreateThingRepository>(
  "MyExtension/CreateThingRepository"
);

export namespace CreateThingRepository {
  export type Interface = ICreateThingRepository;
}
```

## Feature Registration

```ts
// src/api/features/CreateThing/feature.ts
import { createFeature } from "webiny/api";
import CreateThingUseCase from "./CreateThingUseCase.js";
import CreateThingRepository from "./CreateThingRepository.js";

export const CreateThingFeature = createFeature({
  name: "CreateThing",
  register(container) {
    container.register(CreateThingUseCase); // transient (default)
    container.register(CreateThingRepository).inSingletonScope();
  }
});
```

## Container Registration Methods

| Method                                                   | When to Use                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `container.register(Implementation)`                     | Register a class (created via `Abstraction.createImplementation`) |
| `container.registerInstance(abstraction, instance)`      | Register a plain object that satisfies the interface              |
| `container.registerFactory(abstraction, () => instance)` | Register a lazy factory                                           |

## Reading API BuildParams

A deployed API must **NEVER** use `process.env` to read configuration. All configuration flows through `BuildParams` via DI:

```ts
// Inside an API service — use BuildParams, NEVER process.env
import { BuildParams } from "webiny/api/build-params";

class MyServiceImpl implements MyService.Interface {
  constructor(private buildParams: BuildParams.Interface) {}

  doSomething() {
    // buildParams.get() returns T | null — always handle null
    const endpoint = this.buildParams.get<string>("MY_API_ENDPOINT");
    if (!endpoint) {
      throw new Error("MY_API_ENDPOINT build param is not configured.");
    }
  }
}

export default MyService.createImplementation({
  implementation: MyServiceImpl,
  dependencies: [BuildParams]
});
```

> **Note:** BuildParam _declarations_ (`<Api.BuildParam>`) live in the top-level extension component — see the **webiny-full-stack-architect** skill.

## Core APIs

### `createAbstraction<T>(name: string)`

Creates a typed DI token. The generic `T` is the interface that implementations must satisfy. The `name` string is used for debugging and error messages.

| Import  | `import { createAbstraction } from "webiny/api"` |
| ------- | ------------------------------------------------ |
| Returns | `Abstraction<T>`                                 |

### `createFeature(def)`

Creates a feature definition that the framework loads as an extension.

| Import                    | `import { createFeature } from "webiny/api"`              |
| ------------------------- | --------------------------------------------------------- |
| `def.name`                | Unique feature name (convention: `"AppName/FeatureName"`) |
| `def.register(container)` | Called at startup with the DI `Container` instance        |

## Key Rules

1. **Abstractions first** — any new business logic MUST be encapsulated in `createAbstraction` + `createFeature`. Never put logic directly in an EventHandler, GraphQL resolver, or CLI command.
2. **Namespace convention** — every abstraction exports `namespace MyAbstraction { export type Interface = ...; }` so consumers can type dependencies as `MyAbstraction.Interface`.
3. **Name uniqueness** — feature names must be globally unique; use `"AppName/FeatureName"` convention.
4. **Constructor param order** — `dependencies` array must match constructor parameter order exactly.
5. **No `process.env` at runtime** — deployed API services must NEVER read `process.env`. All configuration flows through `BuildParams`.
6. **Scoping** — use cases = transient (default), repositories = singleton (`.inSingletonScope()`).
7. **Import extensions** — always use `.js` extensions in import paths (ESM).

## Related Skills

- **webiny-full-stack-architect** — Top-level component, shared domain layer, BuildParam declarations
- **webiny-dependency-injection** — The `createImplementation` DI pattern and injectable services
- **webiny-custom-graphql-api** — GraphQL schema creation with `GraphQLSchemaFactory`
- **webiny-use-case-pattern** — UseCase pattern with `Result` type
- **webiny-event-handler-pattern** — EventHandler lifecycle hooks
