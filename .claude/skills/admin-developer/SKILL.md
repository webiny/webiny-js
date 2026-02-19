---
name: admin-developer
description: Use when implementing admin-area features (headless or presentation). Covers headless features (use cases, services, repositories, gateways), presentation features (presenters, view models, React views), DI container wiring, MobX reactivity, permissions (Security.Permissions schema and custom UI), and when to use which type.
---

# Admin Developer Guide

## Two Types of Features

### Headless Features

Located under `features/`. No UI. Pure application services — use cases, services, repositories, gateways. Can be injected and invoked from anywhere.

```
features/<domain>/<FeatureName>/
├── abstractions.ts
├── feature.ts
├── <FeatureName>UseCase.ts     # or <FeatureName>Service.ts
├── <FeatureName>Repository.ts
└── <FeatureName>Gateway.ts
```

### Presentation Features

Located under `presentation/`. Contain a Presenter that creates a ViewModel for the React view. May internally compose headless features or own their repo/gateway directly.

```
presentation/<domain>/<FeatureName>/
├── abstractions.ts
├── feature.ts
├── <FeatureName>Presenter.ts
├── <FeatureName>Repository.ts   # only if not reusable
├── <FeatureName>Gateway.ts      # only if not reusable
└── <FeatureName>View.tsx
```

### When to Use Which

- **Reusable logic** (CRUD operations, shared services, anything used by multiple UI areas) → headless feature first, then a presentation feature to wire it to UI.
- **Non-reusable, UI-specific logic** (a single dialog, a config panel) → presentation feature with its own repo/gateway inline.
- **Always**: the React view accesses logic through a presentation feature. Never import a headless feature directly in a React component — wrap it in a presenter or hook.

---

## Headless Features

### Architecture

```
UseCase → Repository → Gateway → External API
```

- **UseCase**: Single application operation. Transient scope (default). Has an `execute()` method.
- **Service**: Stateful, long-lived. Singleton scope. Exposes multiple methods. Uses MobX when observable.
- **Repository**: Owns domain data and cache. Singleton scope.
- **Gateway**: Handles external I/O (GraphQL, REST). Singleton scope.

### Abstractions (`abstractions.ts`)

```typescript
import { createAbstraction } from "@webiny/feature/admin";
import type { Folder } from "~/domain/folder/Folder.js";

// Use Case.
export interface CreateFolderParams {
    title: string;
    slug: string;
    parentId: string | null;
}

export interface ICreateFolderUseCase {
    execute: (params: CreateFolderParams) => Promise<void>;
}

export const CreateFolderUseCase =
    createAbstraction<ICreateFolderUseCase>("CreateFolderUseCase");

export namespace CreateFolderUseCase {
    export type Interface = ICreateFolderUseCase;
    export type Params = CreateFolderParams;
}

// Repository.
export interface ICreateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}

export const CreateFolderRepository =
    createAbstraction<ICreateFolderRepository>("CreateFolderRepository");

export namespace CreateFolderRepository {
    export type Interface = ICreateFolderRepository;
}

// Gateway.
export interface ICreateFolderGateway {
    execute: (dto: FolderGatewayDto) => Promise<FolderDto>;
}

export const CreateFolderGateway =
    createAbstraction<ICreateFolderGateway>("CreateFolderGateway");

export namespace CreateFolderGateway {
    export type Interface = ICreateFolderGateway;
}
```

### Use Case Implementation

```typescript
import { Folder } from "~/domain/folder/Folder.js";
import {
    CreateFolderUseCase as UseCaseAbstraction,
    CreateFolderRepository
} from "./abstractions.js";

class CreateFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateFolderRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(
            Folder.create({
                title: params.title,
                slug: params.slug,
                parentId: params.parentId
            })
        );
    }
}

export const CreateFolderUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateFolderUseCaseImpl,
    dependencies: [CreateFolderRepository]
});
```

### Service Implementation (Stateful, Observable)

For long-lived services that hold observable state (e.g., WcpService, TelemetryService):

```typescript
import { makeAutoObservable, runInAction } from "mobx";
import {
    WcpService as ServiceAbstraction,
    WcpGateway
} from "./abstractions.js";

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

### Feature Registration (`feature.ts`)

```typescript
import { createFeature } from "@webiny/feature/admin";
import { CreateFolderUseCase as UseCase } from "./abstractions.js";
import { CreateFolderUseCase } from "./CreateFolderUseCase.js";
import { CreateFolderRepository } from "./CreateFolderRepository.js";
import { CreateFolderGqlGateway } from "./CreateFolderGqlGateway.js";

export const CreateFolderFeature = createFeature({
    name: "CreateFolder",
    register(container) {
        container.register(CreateFolderUseCase);
        container.register(CreateFolderRepository).inSingletonScope();
        container.register(CreateFolderGqlGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
```

### Composite Features (Aggregating Child Features)

When grouping related features, create a composite with no `resolve`:

```typescript
import { createFeature } from "@webiny/feature/admin";

export const FoldersFeature = createFeature({
    name: "Folders",
    register(container) {
        CreateFolderFeature.register(container);
        UpdateFolderFeature.register(container);
        DeleteFolderFeature.register(container);
    }
});
```

### Consuming Headless Features in React

Always go through a hook or presentation feature — never use `useFeature(HeadlessFeature)` directly in a component's render body without wrapping it:

```typescript
// Hook wrapping a headless feature.
export const useCreateFolder = () => {
    const { useCase } = useFeature(CreateFolderFeature);

    return {
        createFolder: (params: CreateFolderUseCase.Params) => {
            return useCase.execute(params);
        }
    };
};
```

---

## Presentation Features

### Architecture

```
View (React) → Presenter → Repository → Gateway
                              ↑
                    (or composes a headless feature)
```

- **Presenter**: Owns the ViewModel (`vm` getter). Orchestrates loading state. Uses MobX. Transient scope by default.
- **Repository**: Owns domain data. Singleton scope.
- **Gateway**: External I/O. Singleton scope.
- **View**: React component wrapped with `observer`. Reads only from `presenter.vm`.

### Abstractions (`abstractions.ts`)

```typescript
import { createAbstraction } from "@webiny/feature/admin";

export type NextjsConfig = string;

// Presenter.
export interface INextjsConfigVm {
    loading: boolean;
    config: NextjsConfig | undefined;
}

export interface INextjsConfigPresenter {
    vm: INextjsConfigVm;
    init(): void;
}

export const NextjsConfigPresenter =
    createAbstraction<INextjsConfigPresenter>("NextjsConfigPresenter");

export namespace NextjsConfigPresenter {
    export type Interface = INextjsConfigPresenter;
    export type ViewModel = INextjsConfigVm;
}

// Repository.
export interface INextjsConfigRepository {
    getConfig(): NextjsConfig | undefined;
    loadConfig(): Promise<void>;
}

export const NextjsConfigRepository =
    createAbstraction<INextjsConfigRepository>("NextjsConfigRepository");

export namespace NextjsConfigRepository {
    export type Interface = INextjsConfigRepository;
}

// Gateway.
export interface INextjsConfigGateway {
    getConfig(): Promise<NextjsConfig>;
}

export const NextjsConfigGateway =
    createAbstraction<INextjsConfigGateway>("NextjsConfigGateway");

export namespace NextjsConfigGateway {
    export type Interface = INextjsConfigGateway;
}
```

### Presenter Implementation

```typescript
import { makeAutoObservable, runInAction } from "mobx";
import {
    NextjsConfigPresenter as PresenterAbstraction,
    NextjsConfigRepository
} from "./abstractions.js";

class NextjsConfigPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;

    constructor(private repository: NextjsConfigRepository.Interface) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            config: this.repository.getConfig()
        };
    }

    init(): void {
        this.loading = true;
        this.repository.loadConfig().then(() => {
            runInAction(() => {
                this.loading = false;
            });
        });
    }
}

export const NextjsConfigPresenter = PresenterAbstraction.createImplementation({
    implementation: NextjsConfigPresenterImpl,
    dependencies: [NextjsConfigRepository]
});
```

### Repository Implementation

```typescript
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
            return;
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

### Gateway Implementation (GraphQL)

```typescript
import { NextjsConfigGateway as GatewayAbstraction } from "./abstractions.js";
import { GraphQLClient } from "@webiny/app/features/graphqlClient";

const GET_NEXTJS_CONFIG = /* GraphQL */ `
    query GetNextjsConfig {
        websiteBuilder {
            getNextjsConfig {
                data
                error {
                    code
                    message
                    data
                }
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

### Feature Registration (`feature.ts`)

```typescript
import { createFeature } from "@webiny/feature/admin";
import { NextjsConfigPresenter as PresenterAbstraction } from "./abstractions.js";
import { NextjsConfigPresenter } from "./NextjsConfigPresenter.js";
import { NextjsConfigRepository } from "./NextjsConfigRepository.js";
import { NextjsConfigGateway } from "./NextjsConfigGateway.js";

export const NextjsConfigFeature = createFeature({
    name: "NextjsConfig",
    register(container) {
        container.register(NextjsConfigPresenter);
        container.register(NextjsConfigRepository).inSingletonScope();
        container.register(NextjsConfigGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
```

### React View Component

```typescript
import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { NextjsConfigFeature } from "./feature.js";

export const NextjsConfigView = observer(() => {
    const { presenter } = useFeature(NextjsConfigFeature);

    useEffect(() => {
        presenter.init();
    }, []);

    const { loading, config } = presenter.vm;

    if (loading) {
        return <div>Loading...</div>;
    }

    return <div>{config}</div>;
});
```

---

## Extending Features (Decorators)

### Use Case Decorator (Cross-cutting Concerns)

```typescript
class ListFoldersUseCaseWithLoading implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: FoldersLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute() {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(),
            LoadingActionsEnum.list
        );
    }
}
```

### Registering a Decorator

```typescript
export const MyExtensionFeature = createFeature({
    name: "MyExtension",
    register(container) {
        container.registerDecorator(MyPresenterDecorator);
    }
});
```

---

## Permissions

Register permissions via `AdminConfig` + `Security.Permissions`. The framework auto-generates the UI and handles serialization. No form code needed for most apps.

### Schema-Based (Auto-Generated UI)

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as Icon } from "@webiny/icons/shield.svg";

const { Security } = AdminConfig;

export const MyPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="store-manager"
                title="Store Manager"
                description="Manage Store Manager permissions."
                icon={<Icon />}
                schema={{
                    prefix: "sm",
                    fullAccess: { name: "sm.*" },
                    entities: [
                        {
                            id: "product",
                            title: "Products",
                            permission: "sm.product",
                            scopes: ["full", "own"],
                            actions: [
                                { name: "rwd" },
                                { name: "pw" },
                                { name: "import", label: "Import products" },
                                { name: "export", label: "Export products" }
                            ]
                        },
                        {
                            id: "category",
                            title: "Categories",
                            permission: "sm.category",
                            scopes: ["full"],
                            actions: [{ name: "rwd" }]
                        },
                        {
                            id: "settings",
                            title: "Settings",
                            permission: "sm.settings",
                            scopes: ["full"]
                        }
                    ]
                }}
            />
        </AdminConfig>
    );
};
```

Render `<MyPermission />` anywhere in your app's extension component.

### Schema Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `prefix` | `string` | Yes | Permission prefix (e.g., `"sm"`). |
| `fullAccess` | `{ name: string }` | Yes | Permission emitted on "Full access" (e.g., `{ name: "sm.*" }`). |
| `entities` | `EntityDefinition[]` | No | Entity definitions. Omit for binary full/no access. |

#### Entity Definition

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier for form field naming. |
| `title` | `string` | No | Display title. Falls back to `id`. |
| `permission` | `string` | Yes | Permission name emitted (e.g., `"sm.product"`). |
| `scopes` | `("full" \| "own")[]` | Yes | Available access scopes. |
| `actions` | `ActionDefinition[]` | No | Actions on this entity. |
| `dependsOn` | `{ entity: string; requires: string }` | No | Dependency on another entity. |

#### Actions

- `{ name: "rwd" }` — Read/Write/Delete select dropdown. Auto-set to `"rwd"` when scope is `"own"`.
- `{ name: "pw" }` — Publish/Unpublish checkbox group.
- `{ name: "custom", label: "Label" }` — Custom boolean flag.

#### Entity Dependencies

Child entities can depend on a parent. If the parent lacks the required action, the child is pruned from output. `"own"` scope cascades to dependents.

```ts
{
    id: "review",
    permission: "sm.review",
    scopes: ["full", "own"],
    actions: [{ name: "rwd" }],
    dependsOn: { entity: "product", requires: "r" }
}
```

### Simple Apps (No Entities)

Omit `entities` for binary full/no access:

```tsx
<Security.Permissions
    name="my-app"
    title="My App"
    description="Manage My App access permissions."
    schema={{ prefix: "ma", fullAccess: { name: "ma.*" } }}
/>
```

### Custom Permission UI

When the auto-generated UI isn't enough (resource pickers, custom controls), pass `element` instead of `schema`:

```tsx
<Security.Permissions
    name="headless-cms"
    title="Headless CMS"
    description="Manage CMS access permissions."
    icon={<CmsIcon />}
    element={<CmsPermissions />}
/>
```

The custom component uses `usePermissionValue` and `usePermissionForm`:

```tsx
import { usePermissionValue, usePermissionForm, createPermissionSchema } from "@webiny/app-admin";
import { Form } from "@webiny/form";

const schema = createPermissionSchema({
    prefix: "cms",
    fullAccess: { name: "cms.*" },
    entities: [/* ... */]
});

const CmsPermissions = () => {
    const { value, onChange } = usePermissionValue();
    const { formData, onFormChange } = usePermissionForm(schema, {
        value,
        onChange,
        deserialize(permissions) {
            return { selectedEndpoints: extractEndpoints(permissions) };
        },
        serialize(formData, corePermissions) {
            return applyEndpoints(formData, corePermissions);
        }
    });

    return (
        <Form data={formData} onChange={onFormChange}>
            {/* Custom form UI */}
        </Form>
    );
};
```

### `Security.Permissions` Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Unique identifier for this permission renderer. |
| `title` | `string` | Yes | Display title in the accordion header. |
| `description` | `string` | No | Description shown below the title. |
| `icon` | `ReactElement` | No | Icon in the accordion header. |
| `schema` | `PermissionSchema` | One of `schema`/`element` | Auto-generate UI from schema. |
| `element` | `ReactElement` | One of `schema`/`element` | Fully custom permission UI. |
| `system` | `boolean` | No | If `true`, renders before app-level permissions. |

---

## Scoping Rules

| Layer | Scope | Rationale |
|---|---|---|
| UseCase | Transient (default) | Fresh per invocation. |
| Service | `.inSingletonScope()` | Long-lived, holds state. |
| Presenter | Transient (default) | One per view instance. Use singleton if shared across views. |
| Repository | `.inSingletonScope()` | One cache instance. |
| Gateway | `.inSingletonScope()` | Stateless but expensive to create. |

---

## Code Conventions

- Use `createAbstraction` from `@webiny/feature/admin` — never `new Abstraction()`.
- All implementations use `createImplementation` with a `dependencies` array matching constructor order.
- Implementation classes are **not exported** — only the `createImplementation` result.
- One class per file. One named export per file.
- One named import per line.
- Use `.js` extensions in all relative imports.
- Use `~` alias for package-internal absolute imports.
- MobX `makeAutoObservable(this)` in every presenter, repository, and service constructor.
- Async state mutations wrapped in `runInAction`.
- Views use `observer` from `mobx-react-lite` and read only from `presenter.vm`.

## Checklist

- [ ] Decided: headless (reusable) or presentation-only (non-reusable)?
- [ ] All abstractions use `createAbstraction`.
- [ ] All implementations use `createImplementation` with correct `dependencies`.
- [ ] Scoping: repos/gateways/services → singleton; use cases/presenters → transient.
- [ ] MobX `makeAutoObservable(this)` in stateful classes.
- [ ] Async state mutations wrapped in `runInAction`.
- [ ] View uses `observer` and reads only from `presenter.vm`.
- [ ] One class per file, one named export per file, one import per line.
- [ ] All relative imports use `.js` extension.
