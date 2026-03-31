---
name: webiny-admin-architect
context: webiny-extensions
description: >
  Admin-side architecture patterns for Webiny extensions. Use this skill when building
  frontend features with headless features (UseCase/Repository/Gateway), presentation
  features (Presenter/ViewModel/hooks/components), MobX-based presenters, RegisterFeature,
  and Admin BuildParams. Covers the admin/ directory structure for both features/ and
  presentation/ layers.
---

# Admin Architecture Patterns

## TL;DR

Admin extensions are React components that register headless features (business logic with no UI) and presentation features (MobX presenters, React hooks, components). Headless features live in `admin/features/` and follow **UseCase → Repository → Gateway** layering. Presentation features live in `admin/presentation/` and add a **Presenter** (MobX view model) layer on top. Both use `createFeature` and `createAbstraction` from `webiny/admin`.

**All features — both headless and presentation — MUST provide a `resolve` function** in `createFeature`. This is how the `useFeature` hook accesses resolved instances from the DI container. Without `resolve`, the feature cannot be consumed from React.

## Admin Directory Structure

```
admin/
├── Extension.tsx         # Admin entry point (React component)
├── features/             # Headless features (business logic, no UI)
│   └── EnableThing/
│       ├── abstractions.ts
│       ├── EnableThingUseCase.ts
│       ├── EnableThingRepository.ts
│       ├── EnableThingGateway.ts
│       └── feature.ts
└── presentation/         # Presentation layer (hooks, components, presenters)
    └── CurrentThing/
        ├── abstractions.ts   # Presenter + ViewModel interfaces
        ├── CurrentThingPresenter.ts    # MobX-based view model
        ├── useCurrentThing.ts          # React hook for consumers
        ├── feature.ts                  # createFeature registration
        └── components/                 # React UI components
```

## Admin Extension Entry Point

The Admin entry point is a React component that registers features, providers, UI decorators, and config:

```tsx
// src/admin/Extension.tsx
import React from "react";
import { AdminConfig, RegisterFeature } from "webiny/admin";
import { CurrentThingFeature } from "./presentation/CurrentThing/feature.js";
import { EnableThingFeature } from "./features/EnableThing/index.js";
import { CurrentThingProvider } from "./presentation/CurrentThing/CurrentThingProvider.js";
import { ThingListView } from "./presentation/ThingListView/ThingListView.js";

export const Extension = () => {
  return (
    <>
      {/* Register headless features (use cases, repositories, gateways) */}
      <RegisterFeature feature={EnableThingFeature} />

      {/* Register presentation features (presenters, view models) */}
      <RegisterFeature feature={CurrentThingFeature} />

      {/* Providers and UI components */}
      <CurrentThingProvider />
      <ThingListView />

      {/* Admin config (menus, routes, etc.) */}
      <AdminConfig>{/* Menu items, route definitions, etc. */}</AdminConfig>
    </>
  );
};
```

## Headless Features (`features/`)

Headless features contain business logic with no UI — use cases, repositories, and gateways. They follow the same layering as API features but use `webiny/admin` imports.

### Abstractions

```ts
// src/admin/features/EnableThing/abstractions.ts
import { createAbstraction } from "webiny/admin";

export interface IEnableThingUseCase {
  execute(id: string): Promise<void>;
}

export const EnableThingUseCase = createAbstraction<IEnableThingUseCase>("EnableThingUseCase");

export namespace EnableThingUseCase {
  export type Interface = IEnableThingUseCase;
}

export interface IEnableThingRepository {
  execute(id: string): Promise<void>;
}

export const EnableThingRepository =
  createAbstraction<IEnableThingRepository>("EnableThingRepository");

export namespace EnableThingRepository {
  export type Interface = IEnableThingRepository;
}

export interface IEnableThingGateway {
  enableThing(id: string): Promise<boolean>;
}

export const EnableThingGateway = createAbstraction<IEnableThingGateway>("EnableThingGateway");

export namespace EnableThingGateway {
  export type Interface = IEnableThingGateway;
}
```

### Feature Registration

Headless features **must** provide a `resolve` function that returns the resolved use case (or multiple exports). This is what makes the feature consumable via `useFeature()` in the presentation layer:

```ts
// src/admin/features/EnableThing/feature.ts
import { createFeature } from "webiny/admin";
import { EnableThingUseCase as UseCase } from "./abstractions.js";
import { EnableThingUseCase } from "./EnableThingUseCase.js";
import { EnableThingRepository } from "./EnableThingRepository.js";
import { EnableThingGateway } from "./EnableThingGateway.js";

export const EnableThingFeature = createFeature({
  name: "EnableThing",
  register(container) {
    container.register(EnableThingUseCase);
    container.register(EnableThingRepository).inSingletonScope();
    container.register(EnableThingGateway).inSingletonScope();
  },
  resolve(container) {
    return {
      useCase: container.resolve(UseCase)
    };
  }
});
```

## The `useFeature` Hook — Bridging DI and React

`useFeature` is the standard way to access headless features from React. It resolves the feature from the DI container and returns whatever `resolve` returned:

```tsx
import { useFeature } from "webiny/admin";
import { EnableThingFeature } from "~/features/EnableThing/feature.js";

// In a presentation hook or component:
const { useCase } = useFeature(EnableThingFeature);
await useCase.execute(id);
```

Presentation hooks wrap `useFeature` to provide a clean, typed API to React components:

```tsx
// src/admin/presentation/EnableThing/useEnableThing.ts
import { useFeature } from "webiny/admin";
import { EnableThingFeature } from "~/features/EnableThing/feature.js";

export function useEnableThing() {
  const { useCase } = useFeature(EnableThingFeature);

  return {
    enableThing: useCase.execute.bind(useCase)
  };
}
```

### Common `useFeature` patterns

**Multiple features in one hook:**

```tsx
export function useAuthentication() {
  const { useCase: logInUseCase } = useFeature(LogInFeature);
  const { useCase: logOutUseCase } = useFeature(LogOutFeature);

  return {
    login: logInUseCase.execute.bind(logInUseCase),
    logout: logOutUseCase.execute.bind(logOutUseCase)
  };
}
```

**MobX reactive state synced to React:**

```tsx
export function useIdentity() {
  const { identityContext } = useFeature(IdentityContextFeature);

  const [identity, setIdentity] = useState(identityContext.getIdentity());

  useEffect(() => {
    return autorun(() => {
      setIdentity(identityContext.getIdentity());
    });
  }, [identityContext]);

  return { identity, isAuthenticated: identity.isAuthenticated };
}
```

## Presentation Features (`presentation/`)

Presentation features contain the UI layer — a **Presenter** (MobX view model) that produces a ViewModel for React, plus hooks and components. The Presenter typically depends on a **headless feature abstraction** (use case or service) for data and actions — it does NOT duplicate the repository/gateway layering.

### Typical Pattern: Presenter depends on a headless feature

The Presenter injects a headless feature's use case or service as a DI dependency:

```ts
// src/admin/presentation/CurrentThing/abstractions.ts
import { createAbstraction } from "webiny/admin";
import type { MyEntity } from "~/shared/MyEntity.js";

export interface ICurrentThingVm {
  loading: boolean;
  entity: MyEntity | undefined;
  error: Error | undefined;
}

export interface ICurrentThingPresenter {
  vm: ICurrentThingVm;
  init(): void;
}

export const CurrentThingPresenter =
  createAbstraction<ICurrentThingPresenter>("CurrentThingPresenter");

export namespace CurrentThingPresenter {
  export type Interface = ICurrentThingPresenter;
  export type ViewModel = ICurrentThingVm;
}
```

```ts
// src/admin/presentation/CurrentThing/feature.ts
import { createFeature } from "webiny/admin";
import { CurrentThingPresenter as PresenterAbstraction } from "./abstractions.js";
import { CurrentThingPresenter } from "./CurrentThingPresenter.js";

export const CurrentThingFeature = createFeature({
  name: "CurrentThing",
  register(container) {
    container.register(CurrentThingPresenter);
  },
  resolve(container) {
    return {
      presenter: container.resolve(PresenterAbstraction)
    };
  }
});
```

The Presenter implementation injects the headless feature's abstraction (e.g., a use case):

```ts
// src/admin/presentation/CurrentThing/CurrentThingPresenter.ts
import { GetThingUseCase } from "~/features/GetThing/abstractions.js";

class CurrentThingPresenterImpl implements CurrentThingPresenter.Interface {
  vm: CurrentThingPresenter.ViewModel = { loading: false, entity: undefined, error: undefined };

  constructor(private getThingUseCase: GetThingUseCase.Interface) {}

  async init() {
    this.vm.loading = true;
    const result = await this.getThingUseCase.execute();
    // ... update vm
  }
}

export default CurrentThingPresenter.createImplementation({
  implementation: CurrentThingPresenterImpl,
  dependencies: [GetThingUseCase]
});
```

### One-off Pattern: Presenter with its own repository/gateway

On rare occasions, when a presentation feature does not contain reusable business logic (no headless feature to depend on), the presentation feature can contain its own repository and gateway alongside the presenter:

```ts
// src/admin/presentation/Dashboard/feature.ts — one-off, no headless feature
import { createFeature } from "webiny/admin";
import { DashboardPresenter as PresenterAbstraction } from "./abstractions.js";
import { DashboardPresenter } from "./DashboardPresenter.js";
import { DashboardRepository } from "./DashboardRepository.js";
import { DashboardGateway } from "./DashboardGateway.js";

export const DashboardFeature = createFeature({
  name: "Dashboard",
  register(container) {
    container.register(DashboardPresenter);
    container.register(DashboardRepository).inSingletonScope();
    container.register(DashboardGateway).inSingletonScope();
  },
  resolve(container) {
    return {
      presenter: container.resolve(PresenterAbstraction)
    };
  }
});
```

> **Prefer the typical pattern.** Only use the one-off pattern when the business logic is truly presentation-specific and will never be reused by other features.

## Observable Service Implementation

For long-lived services that hold observable state (e.g., project config, feature flags):

```ts
import { makeAutoObservable, runInAction } from "mobx";
import { WcpService as ServiceAbstraction, WcpGateway } from "./abstractions.js";

class WcpServiceImpl implements ServiceAbstraction.Interface {
    private project: ILicense | null = null;

    constructor(private gateway: WcpGateway.Interface) {
        makeAutoObservable(this);
    }

    getProject(): ILicense {
        return this.project;
    }

    async loadProject(): Promise<void> {
        const data = await this.gateway.fetchProject();
        runInAction(() => {
            this.project = data;
        });
    }
}

export const WcpService = ServiceAbstraction.createImplementation({
    implementation: WcpServiceImpl,
    dependencies: [WcpGateway]
});
```

- Registered in **singleton scope** — long-lived, holds state
- Use `makeAutoObservable(this)` in the constructor
- Wrap async state mutations in `runInAction`

## Repository Implementation

Repositories own domain data and cache. They use MobX for reactivity:

```ts
import { makeAutoObservable, runInAction } from "mobx";
import {
    NextjsConfigRepository as RepositoryAbstraction,
    NextjsConfigGateway,
    NextjsConfig
} from "./abstractions.js";

class NextjsConfigRepositoryImpl implements RepositoryAbstraction.Interface {
    private config: NextjsConfig | undefined = undefined;

    constructor(private gateway: NextjsConfigGateway.Interface) {
        makeAutoObservable(this);
    }

    getConfig(): NextjsConfig | undefined {
        return this.config;
    }

    async loadConfig(): Promise<void> {
        if (this.config) {
            return; // Already loaded — cache hit
        }

        const config = await this.gateway.getConfig();
        runInAction(() => {
            this.config = config;
        });
    }
}

export const NextjsConfigRepository = RepositoryAbstraction.createImplementation({
    implementation: NextjsConfigRepositoryImpl,
    dependencies: [NextjsConfigGateway]
});
```

## Gateway Implementation (GraphQL)

Gateways handle external I/O. Use `GraphQLClient` for GraphQL calls:

```ts
import { NextjsConfigGateway as GatewayAbstraction } from "./abstractions.js";
import { GraphQLClient } from "@webiny/app/features/graphqlClient";

const GET_NEXTJS_CONFIG = /* GraphQL */ `
    query GetNextjsConfig {
        websiteBuilder {
            getNextjsConfig {
                data
                error { code message data }
            }
        }
    }
`;

type GetNextjsConfigResponse = {
    websiteBuilder: {
        getNextjsConfig:
            | { data: string; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class NextjsGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: GraphQLClient.Interface) {}

    async getConfig(): Promise<string> {
        const response = await this.client.execute<GetNextjsConfigResponse>({
            query: GET_NEXTJS_CONFIG
        });

        const envelope = response.websiteBuilder.getNextjsConfig;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const NextjsConfigGateway = GatewayAbstraction.createImplementation({
    implementation: NextjsGraphQLGateway,
    dependencies: [GraphQLClient]
});
```

**Key points:**
- Define the GraphQL query as a string constant with `/* GraphQL */` comment for syntax highlighting
- Type the response shape explicitly
- Handle the `data`/`error` envelope pattern
- Inject `GraphQLClient` from `@webiny/app/features/graphqlClient`

## Composite Features (Aggregating Child Features)

When grouping related features, create a composite with no `resolve`:

```ts
import { createFeature } from "webiny/admin";

export const FoldersFeature = createFeature({
    name: "Folders",
    register(container) {
        CreateFolderFeature.register(container);
        UpdateFolderFeature.register(container);
        DeleteFolderFeature.register(container);
    }
});
```

## Extending Features (Decorators)

Decorators add cross-cutting concerns without modifying the core implementation:

```ts
class ListFoldersUseCaseWithLoading implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: FoldersLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface  // decoratee is LAST
    ) {}

    async execute() {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(),
            LoadingActionsEnum.list
        );
    }
}
```

Register with `container.registerDecorator()`:

```ts
export const MyExtensionFeature = createFeature({
    name: "MyExtension",
    register(container) {
        container.registerDecorator(MyPresenterDecorator);
    }
});
```

**Rules:**
- Implements the same interface as the decorated abstraction
- Constructor: extra dependencies first, `decoratee` **last**
- The `dependencies` array does NOT include the decoratee

## Reading Admin BuildParams

There are two ways to read build parameters on the Admin side:

### 1. Via `useBuildParams()` hook — in React hooks and components

```tsx
import { useBuildParams } from "webiny/admin/build-params";

const MyComponent = () => {
  const buildParams = useBuildParams();
  // Returns T | null — always handle null
  const dashboardUrl = buildParams.get<string>("DASHBOARD_URL");

  return dashboardUrl ? <a href={dashboardUrl}>Dashboard</a> : null;
};
```

### 2. Via `BuildParams` DI abstraction — in Presenters, Repositories, Gateways

When you need build params inside a DI-managed class (Presenter, Repository, etc.), inject `BuildParams` as a dependency:

```ts
import { BuildParams } from "webiny/admin/build-params";

class MyPresenterImpl implements MyPresenter.Interface {
  constructor(private buildParams: BuildParams.Interface) {}

  get vm() {
    const apiUrl = this.buildParams.get<string>("MY_API_URL");
    // ...
  }
}

export default MyPresenter.createImplementation({
  implementation: MyPresenterImpl,
  dependencies: [BuildParams]
});
```

> **Note:** `buildParams.get<T>()` returns `T | null` — always handle the null case.

> BuildParam _declarations_ (`<Admin.BuildParam>`) live in the top-level extension component — see the **webiny-full-stack-architect** skill.

## Core APIs

### `createAbstraction<T>(name: string)`

Creates a typed DI token for admin-side abstractions.

| Import  | `import { createAbstraction } from "webiny/admin"` |
| ------- | -------------------------------------------------- |
| Returns | `Abstraction<T>`                                   |

### `createFeature(def)`

Creates a feature definition for the admin runtime.

| Import                    | `import { createFeature } from "webiny/admin"`                   |
| ------------------------- | ---------------------------------------------------------------- |
| `def.name`                | Unique feature name (convention: `"AppName/FeatureName"`)        |
| `def.register(container)` | Called at startup with the DI `Container` instance               |
| `def.resolve(container)`  | **Required.** Resolves abstractions for `useFeature()` consumers |

## Key Rules

1. **Abstractions first** — any new business logic MUST be encapsulated in `createAbstraction` + `createFeature`.
2. **Namespace convention** — every abstraction exports `namespace MyAbstraction { export type Interface = ...; }`.
3. **`resolve` is mandatory** — every `createFeature` (headless or presentation) MUST provide a `resolve` function. This is how `useFeature()` accesses resolved instances from DI.
4. **Headless vs Presentation** — business logic (use cases, repos, gateways) goes in `features/`; UI layer (presenters, hooks, components) goes in `presentation/`.
5. **Scoping** — use cases = transient (default), repositories/gateways = singleton (`.inSingletonScope()`).
6. **`useFeature` is the bridge** — presentation hooks call `useFeature(SomeFeature)` to get resolved exports, then wrap them for React consumption.
7. **Import extensions** — always use `.js` extensions in import paths (ESM).

## Related Skills

- **webiny-admin-permissions** — Admin permission UI registration (Security.Permissions schema, custom UIs)
- **webiny-full-stack-architect** — Top-level component, shared domain layer, BuildParam declarations
- **webiny-dependency-injection** — The `createImplementation` DI pattern and injectable services
- **webiny-admin-ui-extensions** — Admin UI customization, decorators, theming, forms, and config
