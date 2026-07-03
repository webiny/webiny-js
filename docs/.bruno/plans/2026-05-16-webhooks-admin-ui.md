# Webhooks Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin UI for managing webhooks — list, create/edit form, delivery log drawer, permissions.

**Architecture:** 3-layer admin pattern (Gateway → UseCase → Presenter). Gateway calls `WebinySdk` (`sdk.webhooks.*`). List views use shared `ListPresenter` + `IDataSource`. Form uses `FormModel`. All DI via `createAbstraction`/`createFeature`.

**Tech Stack:** TypeScript, MobX, React, Webiny DI (`@webiny/feature/admin`), `@webiny/sdk`, `@webiny/admin-ui`, `@webiny/app-admin`

**Spec:** `docs/superpowers/specs/2026-05-16-webhooks-admin-ui-design.md`

**Parallelization:** Tasks 1-3 have no dependencies and can run in parallel. Tasks 4-6 depend on Tasks 1-3 and can run in parallel with each other. Task 7 depends on all previous tasks.

```
Wave 1 (parallel):  Task 1 (Foundation)  |  Task 2 (CRUD features)  |  Task 3 (Delivery+Event features)
Wave 2 (parallel):  Task 4 (List presenter)  |  Task 5 (Form presenter)  |  Task 6 (Deliveries presenter)
Wave 3:             Task 7 (Extension wiring)
```

---

## Conventions

All files live under `packages/webhooks/src/admin/` (referenced as `admin/` below for brevity).

**Imports:**
- `import { createAbstraction } from "@webiny/feature/admin";`
- `import { createFeature } from "@webiny/feature/admin";`
- `import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";`
- `import type { Webhook, WebhookDelivery, WebhookEvent } from "@webiny/sdk";`
- SDK types re-exported from `@webiny/sdk` — no custom DTOs needed.

**Patterns (apply to every feature):**
- One named import per line.
- One class per file.
- `export const X = Abstraction.createImplementation(...)` at bottom of file.
- Namespace pattern: `export namespace Foo { export type Interface = IFoo; }`.
- Gateways: singleton scope. UseCases: transient (default).
- Every `createFeature` must have a `resolve` function.
- Comments end with period. Use `//` for single-line, `/* */` for multi-line.
- No default exports.

---

## Task 1: Foundation

Shared types, routes, permissions feature, security presentation helpers. No dependencies.

**Files:**
- Create: `admin/shared/types.ts`
- Create: `admin/routes.ts`
- Create: `admin/features/permissions/abstractions.ts`
- Create: `admin/features/permissions/feature.ts`
- Create: `admin/features/permissions/index.ts`
- Create: `admin/presentation/security/usePermissions.ts`
- Create: `admin/presentation/security/HasPermission.tsx`

- [ ] **Step 1: Create shared types**

```ts
// admin/shared/types.ts
export type {
    Webhook,
    WebhookDelivery,
    WebhookEvent
} from "@webiny/sdk";

export type {
    ListWebhooksParams,
    ListWebhooksResult
} from "@webiny/sdk";

export type {
    ListWebhookDeliveriesParams,
    ListWebhookDeliveriesResult
} from "@webiny/sdk";

export type {
    CreateWebhookParams
} from "@webiny/sdk";

export type {
    UpdateWebhookParams
} from "@webiny/sdk";
```

- [ ] **Step 2: Create routes**

```ts
// admin/routes.ts
import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "Webhooks/List",
        path: "/webhooks"
    }),
    Form: new Route({
        name: "Webhooks/Form",
        path: "/webhooks/:id",
        params: zod => ({
            id: zod.string()
        })
    })
};
```

- [ ] **Step 3: Create permissions abstractions**

```ts
// admin/features/permissions/abstractions.ts
import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const WebhookPermissions = createPermissionsAbstraction(WEBHOOK_PERMISSIONS_SCHEMA);

export namespace WebhookPermissions {
    export type Interface = Permissions<typeof WEBHOOK_PERMISSIONS_SCHEMA>;
}
```

- [ ] **Step 4: Create permissions feature**

```ts
// admin/features/permissions/feature.ts
import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { WebhookPermissions } from "./abstractions.js";

export const WebhookPermissionsFeature = createPermissionsFeature(
    WEBHOOK_PERMISSIONS_SCHEMA,
    WebhookPermissions
);
```

- [ ] **Step 5: Create permissions index**

```ts
// admin/features/permissions/index.ts
export { WebhookPermissions } from "./abstractions.js";
export { WebhookPermissionsFeature } from "./feature.js";
```

- [ ] **Step 6: Create usePermissions hook**

```ts
// admin/presentation/security/usePermissions.ts
import { createUsePermissions } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(WebhookPermissions);
```

- [ ] **Step 7: Create HasPermission component**

```tsx
// admin/presentation/security/HasPermission.tsx
import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const HasPermission = createHasPermission(WebhookPermissions, WEBHOOK_PERMISSIONS_SCHEMA);
```

- [ ] **Step 8: Commit**

```bash
git add packages/webhooks/src/admin/shared packages/webhooks/src/admin/routes.ts packages/webhooks/src/admin/features/permissions packages/webhooks/src/admin/presentation/security
git commit -m "feat(webhooks): add admin foundation — types, routes, permissions"
```

---

## Task 2: Webhook CRUD Features

Five headless features: listWebhooks, getWebhook, createWebhook, updateWebhook, deleteWebhook. Each follows the same pattern: abstractions → gateway (SDK call) → usecase (delegates to gateway) → feature (DI wiring) → index. No dependencies on other tasks.

**Files (per feature — 5 features × 5 files = 25 files):**
- Create: `admin/features/listWebhooks/{abstractions,ListWebhooksGateway,ListWebhooksUseCase,feature,index}.ts`
- Create: `admin/features/getWebhook/{abstractions,GetWebhookGateway,GetWebhookUseCase,feature,index}.ts`
- Create: `admin/features/createWebhook/{abstractions,CreateWebhookGateway,CreateWebhookUseCase,feature,index}.ts`
- Create: `admin/features/updateWebhook/{abstractions,UpdateWebhookGateway,UpdateWebhookUseCase,feature,index}.ts`
- Create: `admin/features/deleteWebhook/{abstractions,DeleteWebhookGateway,DeleteWebhookUseCase,feature,index}.ts`

### listWebhooks

- [ ] **Step 1: Create listWebhooks abstractions**

```ts
// admin/features/listWebhooks/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface ListWebhooksGatewayParams {
    where?: { enabled?: boolean };
    limit?: number;
    after?: string;
}

export interface ListWebhooksGatewayResult {
    data: Webhook[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export interface IListWebhooksGateway {
    execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult>;
}

export const ListWebhooksGateway = createAbstraction<IListWebhooksGateway>("ListWebhooksGateway");

export namespace ListWebhooksGateway {
    export type Interface = IListWebhooksGateway;
}

export interface IListWebhooksUseCase {
    execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult>;
}

export const ListWebhooksUseCase = createAbstraction<IListWebhooksUseCase>("ListWebhooksUseCase");

export namespace ListWebhooksUseCase {
    export type Interface = IListWebhooksUseCase;
}
```

- [ ] **Step 2: Create ListWebhooksGateway**

```ts
// admin/features/listWebhooks/ListWebhooksGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import {
    ListWebhooksGateway as GatewayAbstraction,
    type ListWebhooksGatewayParams,
    type ListWebhooksGatewayResult
} from "./abstractions.js";

class ListWebhooksGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult> {
        const result = await this.sdk.webhooks.listWebhooks({
            where: params.where,
            limit: params.limit,
            after: params.after
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return {
            data: result.value.data,
            meta: result.value.meta
        };
    }
}

export const ListWebhooksGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhooksGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 3: Create ListWebhooksUseCase**

```ts
// admin/features/listWebhooks/ListWebhooksUseCase.ts
import {
    ListWebhooksUseCase as UseCaseAbstraction,
    ListWebhooksGateway,
    type ListWebhooksGatewayParams,
    type ListWebhooksGatewayResult
} from "./abstractions.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListWebhooksGateway.Interface) {}

    async execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult> {
        return this.gateway.execute(params);
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [ListWebhooksGateway]
});
```

- [ ] **Step 4: Create listWebhooks feature**

```ts
// admin/features/listWebhooks/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { ListWebhooksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWebhooksUseCase } from "./ListWebhooksUseCase.js";
import { ListWebhooksGateway } from "./ListWebhooksGateway.js";

export const ListWebhooksFeature = createFeature({
    name: "Webhooks/ListWebhooks",
    register(container) {
        container.register(ListWebhooksUseCase);
        container.register(ListWebhooksGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

- [ ] **Step 5: Create listWebhooks index**

```ts
// admin/features/listWebhooks/index.ts
export { ListWebhooksUseCase } from "./abstractions.js";
export { ListWebhooksFeature } from "./feature.js";
```

### getWebhook

- [ ] **Step 6: Create getWebhook abstractions**

```ts
// admin/features/getWebhook/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface IGetWebhookGateway {
    execute(id: string): Promise<Webhook>;
}

export const GetWebhookGateway = createAbstraction<IGetWebhookGateway>("GetWebhookGateway");

export namespace GetWebhookGateway {
    export type Interface = IGetWebhookGateway;
}

export interface IGetWebhookUseCase {
    execute(id: string): Promise<Webhook>;
}

export const GetWebhookUseCase = createAbstraction<IGetWebhookUseCase>("GetWebhookUseCase");

export namespace GetWebhookUseCase {
    export type Interface = IGetWebhookUseCase;
}
```

- [ ] **Step 7: Create GetWebhookGateway**

```ts
// admin/features/getWebhook/GetWebhookGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import { GetWebhookGateway as GatewayAbstraction } from "./abstractions.js";

class GetWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string): Promise<Webhook> {
        const result = await this.sdk.webhooks.getWebhook({ id });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const GetWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: GetWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 8: Create GetWebhookUseCase**

```ts
// admin/features/getWebhook/GetWebhookUseCase.ts
import type { Webhook } from "~/admin/shared/types.js";
import {
    GetWebhookUseCase as UseCaseAbstraction,
    GetWebhookGateway
} from "./abstractions.js";

class GetWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetWebhookGateway.Interface) {}

    async execute(id: string): Promise<Webhook> {
        return this.gateway.execute(id);
    }
}

export const GetWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookUseCaseImpl,
    dependencies: [GetWebhookGateway]
});
```

- [ ] **Step 9: Create getWebhook feature + index**

```ts
// admin/features/getWebhook/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { GetWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookUseCase } from "./GetWebhookUseCase.js";
import { GetWebhookGateway } from "./GetWebhookGateway.js";

export const GetWebhookFeature = createFeature({
    name: "Webhooks/GetWebhook",
    register(container) {
        container.register(GetWebhookUseCase);
        container.register(GetWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/getWebhook/index.ts
export { GetWebhookUseCase } from "./abstractions.js";
export { GetWebhookFeature } from "./feature.js";
```

### createWebhook

- [ ] **Step 10: Create createWebhook abstractions**

```ts
// admin/features/createWebhook/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface CreateWebhookInput {
    name: string;
    endpointUrl: string;
    events: string[];
    slug?: string;
    description?: string;
    enabled?: boolean;
}

export interface ICreateWebhookGateway {
    execute(input: CreateWebhookInput): Promise<Webhook>;
}

export const CreateWebhookGateway = createAbstraction<ICreateWebhookGateway>("CreateWebhookGateway");

export namespace CreateWebhookGateway {
    export type Interface = ICreateWebhookGateway;
}

export interface ICreateWebhookUseCase {
    execute(input: CreateWebhookInput): Promise<Webhook>;
}

export const CreateWebhookUseCase = createAbstraction<ICreateWebhookUseCase>("CreateWebhookUseCase");

export namespace CreateWebhookUseCase {
    export type Interface = ICreateWebhookUseCase;
}
```

- [ ] **Step 11: Create CreateWebhookGateway**

```ts
// admin/features/createWebhook/CreateWebhookGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import {
    CreateWebhookGateway as GatewayAbstraction,
    type CreateWebhookInput
} from "./abstractions.js";

class CreateWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(input: CreateWebhookInput): Promise<Webhook> {
        const result = await this.sdk.webhooks.createWebhook(input);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const CreateWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: CreateWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 12: Create CreateWebhookUseCase**

```ts
// admin/features/createWebhook/CreateWebhookUseCase.ts
import type { Webhook } from "~/admin/shared/types.js";
import {
    CreateWebhookUseCase as UseCaseAbstraction,
    CreateWebhookGateway,
    type CreateWebhookInput
} from "./abstractions.js";

class CreateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: CreateWebhookGateway.Interface) {}

    async execute(input: CreateWebhookInput): Promise<Webhook> {
        return this.gateway.execute(input);
    }
}

export const CreateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateWebhookUseCaseImpl,
    dependencies: [CreateWebhookGateway]
});
```

- [ ] **Step 13: Create createWebhook feature + index**

```ts
// admin/features/createWebhook/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { CreateWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateWebhookUseCase } from "./CreateWebhookUseCase.js";
import { CreateWebhookGateway } from "./CreateWebhookGateway.js";

export const CreateWebhookFeature = createFeature({
    name: "Webhooks/CreateWebhook",
    register(container) {
        container.register(CreateWebhookUseCase);
        container.register(CreateWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/createWebhook/index.ts
export { CreateWebhookUseCase } from "./abstractions.js";
export { CreateWebhookFeature } from "./feature.js";
```

### updateWebhook

- [ ] **Step 14: Create updateWebhook abstractions**

```ts
// admin/features/updateWebhook/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface UpdateWebhookInput {
    name?: string;
    slug?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
}

export interface IUpdateWebhookGateway {
    execute(id: string, input: UpdateWebhookInput): Promise<Webhook>;
}

export const UpdateWebhookGateway = createAbstraction<IUpdateWebhookGateway>("UpdateWebhookGateway");

export namespace UpdateWebhookGateway {
    export type Interface = IUpdateWebhookGateway;
}

export interface IUpdateWebhookUseCase {
    execute(id: string, input: UpdateWebhookInput): Promise<Webhook>;
}

export const UpdateWebhookUseCase = createAbstraction<IUpdateWebhookUseCase>("UpdateWebhookUseCase");

export namespace UpdateWebhookUseCase {
    export type Interface = IUpdateWebhookUseCase;
}
```

- [ ] **Step 15: Create UpdateWebhookGateway**

```ts
// admin/features/updateWebhook/UpdateWebhookGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import {
    UpdateWebhookGateway as GatewayAbstraction,
    type UpdateWebhookInput
} from "./abstractions.js";

class UpdateWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string, input: UpdateWebhookInput): Promise<Webhook> {
        const result = await this.sdk.webhooks.updateWebhook({ id, ...input });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const UpdateWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 16: Create UpdateWebhookUseCase**

```ts
// admin/features/updateWebhook/UpdateWebhookUseCase.ts
import type { Webhook } from "~/admin/shared/types.js";
import {
    UpdateWebhookUseCase as UseCaseAbstraction,
    UpdateWebhookGateway,
    type UpdateWebhookInput
} from "./abstractions.js";

class UpdateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: UpdateWebhookGateway.Interface) {}

    async execute(id: string, input: UpdateWebhookInput): Promise<Webhook> {
        return this.gateway.execute(id, input);
    }
}

export const UpdateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookUseCaseImpl,
    dependencies: [UpdateWebhookGateway]
});
```

- [ ] **Step 17: Create updateWebhook feature + index**

```ts
// admin/features/updateWebhook/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { UpdateWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWebhookUseCase } from "./UpdateWebhookUseCase.js";
import { UpdateWebhookGateway } from "./UpdateWebhookGateway.js";

export const UpdateWebhookFeature = createFeature({
    name: "Webhooks/UpdateWebhook",
    register(container) {
        container.register(UpdateWebhookUseCase);
        container.register(UpdateWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/updateWebhook/index.ts
export { UpdateWebhookUseCase } from "./abstractions.js";
export { UpdateWebhookFeature } from "./feature.js";
```

### deleteWebhook

- [ ] **Step 18: Create deleteWebhook abstractions**

```ts
// admin/features/deleteWebhook/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteWebhookGateway {
    execute(id: string): Promise<boolean>;
}

export const DeleteWebhookGateway = createAbstraction<IDeleteWebhookGateway>("DeleteWebhookGateway");

export namespace DeleteWebhookGateway {
    export type Interface = IDeleteWebhookGateway;
}

export interface IDeleteWebhookUseCase {
    execute(id: string): Promise<boolean>;
}

export const DeleteWebhookUseCase = createAbstraction<IDeleteWebhookUseCase>("DeleteWebhookUseCase");

export namespace DeleteWebhookUseCase {
    export type Interface = IDeleteWebhookUseCase;
}
```

- [ ] **Step 19: Create DeleteWebhookGateway**

```ts
// admin/features/deleteWebhook/DeleteWebhookGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import { DeleteWebhookGateway as GatewayAbstraction } from "./abstractions.js";

class DeleteWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.sdk.webhooks.deleteWebhook({ id });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const DeleteWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 20: Create DeleteWebhookUseCase**

```ts
// admin/features/deleteWebhook/DeleteWebhookUseCase.ts
import {
    DeleteWebhookUseCase as UseCaseAbstraction,
    DeleteWebhookGateway
} from "./abstractions.js";

class DeleteWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: DeleteWebhookGateway.Interface) {}

    async execute(id: string): Promise<boolean> {
        return this.gateway.execute(id);
    }
}

export const DeleteWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWebhookUseCaseImpl,
    dependencies: [DeleteWebhookGateway]
});
```

- [ ] **Step 21: Create deleteWebhook feature + index**

```ts
// admin/features/deleteWebhook/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { DeleteWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWebhookUseCase } from "./DeleteWebhookUseCase.js";
import { DeleteWebhookGateway } from "./DeleteWebhookGateway.js";

export const DeleteWebhookFeature = createFeature({
    name: "Webhooks/DeleteWebhook",
    register(container) {
        container.register(DeleteWebhookUseCase);
        container.register(DeleteWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/deleteWebhook/index.ts
export { DeleteWebhookUseCase } from "./abstractions.js";
export { DeleteWebhookFeature } from "./feature.js";
```

- [ ] **Step 22: Commit all CRUD features**

```bash
git add packages/webhooks/src/admin/features/listWebhooks packages/webhooks/src/admin/features/getWebhook packages/webhooks/src/admin/features/createWebhook packages/webhooks/src/admin/features/updateWebhook packages/webhooks/src/admin/features/deleteWebhook
git commit -m "feat(webhooks): add admin CRUD features — list, get, create, update, delete"
```

---

## Task 3: Delivery & Event Features

Four headless features: listWebhookDeliveries, resendWebhookDelivery, triggerWebhook, listAvailableEvents. No dependencies on other tasks.

**Files:**
- Create: `admin/features/listWebhookDeliveries/{abstractions,ListWebhookDeliveriesGateway,ListWebhookDeliveriesUseCase,feature,index}.ts`
- Create: `admin/features/resendWebhookDelivery/{abstractions,ResendWebhookDeliveryGateway,ResendWebhookDeliveryUseCase,feature,index}.ts`
- Create: `admin/features/triggerWebhook/{abstractions,TriggerWebhookGateway,TriggerWebhookUseCase,feature,index}.ts`
- Create: `admin/features/listAvailableEvents/{abstractions,ListAvailableEventsGateway,ListAvailableEventsUseCase,feature,index}.ts`

### listWebhookDeliveries

- [ ] **Step 1: Create listWebhookDeliveries abstractions**

```ts
// admin/features/listWebhookDeliveries/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";

export interface ListWebhookDeliveriesParams {
    webhookId: string;
    limit?: number;
    after?: string;
}

export interface ListWebhookDeliveriesResult {
    data: WebhookDelivery[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export interface IListWebhookDeliveriesGateway {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesGateway =
    createAbstraction<IListWebhookDeliveriesGateway>("ListWebhookDeliveriesGateway");

export namespace ListWebhookDeliveriesGateway {
    export type Interface = IListWebhookDeliveriesGateway;
}

export interface IListWebhookDeliveriesUseCase {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesUseCase =
    createAbstraction<IListWebhookDeliveriesUseCase>("ListWebhookDeliveriesUseCase");

export namespace ListWebhookDeliveriesUseCase {
    export type Interface = IListWebhookDeliveriesUseCase;
}
```

- [ ] **Step 2: Create ListWebhookDeliveriesGateway**

```ts
// admin/features/listWebhookDeliveries/ListWebhookDeliveriesGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import {
    ListWebhookDeliveriesGateway as GatewayAbstraction,
    type ListWebhookDeliveriesParams,
    type ListWebhookDeliveriesResult
} from "./abstractions.js";

class ListWebhookDeliveriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult> {
        const result = await this.sdk.webhooks.listWebhookDeliveries({
            webhookId: params.webhookId,
            limit: params.limit,
            after: params.after
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return {
            data: result.value.data,
            meta: result.value.meta
        };
    }
}

export const ListWebhookDeliveriesGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 3: Create ListWebhookDeliveriesUseCase**

```ts
// admin/features/listWebhookDeliveries/ListWebhookDeliveriesUseCase.ts
import {
    ListWebhookDeliveriesUseCase as UseCaseAbstraction,
    ListWebhookDeliveriesGateway,
    type ListWebhookDeliveriesParams,
    type ListWebhookDeliveriesResult
} from "./abstractions.js";

class ListWebhookDeliveriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListWebhookDeliveriesGateway.Interface) {}

    async execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult> {
        return this.gateway.execute(params);
    }
}

export const ListWebhookDeliveriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesUseCaseImpl,
    dependencies: [ListWebhookDeliveriesGateway]
});
```

- [ ] **Step 4: Create listWebhookDeliveries feature + index**

```ts
// admin/features/listWebhookDeliveries/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { ListWebhookDeliveriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWebhookDeliveriesUseCase } from "./ListWebhookDeliveriesUseCase.js";
import { ListWebhookDeliveriesGateway } from "./ListWebhookDeliveriesGateway.js";

export const ListWebhookDeliveriesFeature = createFeature({
    name: "Webhooks/ListWebhookDeliveries",
    register(container) {
        container.register(ListWebhookDeliveriesUseCase);
        container.register(ListWebhookDeliveriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/listWebhookDeliveries/index.ts
export { ListWebhookDeliveriesUseCase } from "./abstractions.js";
export { ListWebhookDeliveriesFeature } from "./feature.js";
```

### resendWebhookDelivery

- [ ] **Step 5: Create resendWebhookDelivery abstractions**

```ts
// admin/features/resendWebhookDelivery/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";

export interface IResendWebhookDeliveryGateway {
    execute(id: string): Promise<boolean>;
}

export const ResendWebhookDeliveryGateway =
    createAbstraction<IResendWebhookDeliveryGateway>("ResendWebhookDeliveryGateway");

export namespace ResendWebhookDeliveryGateway {
    export type Interface = IResendWebhookDeliveryGateway;
}

export interface IResendWebhookDeliveryUseCase {
    execute(id: string): Promise<boolean>;
}

export const ResendWebhookDeliveryUseCase =
    createAbstraction<IResendWebhookDeliveryUseCase>("ResendWebhookDeliveryUseCase");

export namespace ResendWebhookDeliveryUseCase {
    export type Interface = IResendWebhookDeliveryUseCase;
}
```

- [ ] **Step 6: Create ResendWebhookDeliveryGateway**

```ts
// admin/features/resendWebhookDelivery/ResendWebhookDeliveryGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import { ResendWebhookDeliveryGateway as GatewayAbstraction } from "./abstractions.js";

class ResendWebhookDeliveryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.sdk.webhooks.resendWebhookDelivery({ id });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const ResendWebhookDeliveryGateway = GatewayAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 7: Create ResendWebhookDeliveryUseCase**

```ts
// admin/features/resendWebhookDelivery/ResendWebhookDeliveryUseCase.ts
import {
    ResendWebhookDeliveryUseCase as UseCaseAbstraction,
    ResendWebhookDeliveryGateway
} from "./abstractions.js";

class ResendWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ResendWebhookDeliveryGateway.Interface) {}

    async execute(id: string): Promise<boolean> {
        return this.gateway.execute(id);
    }
}

export const ResendWebhookDeliveryUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryUseCaseImpl,
    dependencies: [ResendWebhookDeliveryGateway]
});
```

- [ ] **Step 8: Create resendWebhookDelivery feature + index**

```ts
// admin/features/resendWebhookDelivery/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { ResendWebhookDeliveryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ResendWebhookDeliveryUseCase } from "./ResendWebhookDeliveryUseCase.js";
import { ResendWebhookDeliveryGateway } from "./ResendWebhookDeliveryGateway.js";

export const ResendWebhookDeliveryFeature = createFeature({
    name: "Webhooks/ResendWebhookDelivery",
    register(container) {
        container.register(ResendWebhookDeliveryUseCase);
        container.register(ResendWebhookDeliveryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/resendWebhookDelivery/index.ts
export { ResendWebhookDeliveryUseCase } from "./abstractions.js";
export { ResendWebhookDeliveryFeature } from "./feature.js";
```

### triggerWebhook

- [ ] **Step 9: Create triggerWebhook abstractions**

```ts
// admin/features/triggerWebhook/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";

export interface ITriggerWebhookGateway {
    execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery>;
}

export const TriggerWebhookGateway =
    createAbstraction<ITriggerWebhookGateway>("TriggerWebhookGateway");

export namespace TriggerWebhookGateway {
    export type Interface = ITriggerWebhookGateway;
}

export interface ITriggerWebhookUseCase {
    execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery>;
}

export const TriggerWebhookUseCase =
    createAbstraction<ITriggerWebhookUseCase>("TriggerWebhookUseCase");

export namespace TriggerWebhookUseCase {
    export type Interface = ITriggerWebhookUseCase;
}
```

- [ ] **Step 10: Create TriggerWebhookGateway**

```ts
// admin/features/triggerWebhook/TriggerWebhookGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { TriggerWebhookGateway as GatewayAbstraction } from "./abstractions.js";

class TriggerWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery> {
        const result = await this.sdk.webhooks.triggerWebhook({ id, payload });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const TriggerWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: TriggerWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 11: Create TriggerWebhookUseCase**

```ts
// admin/features/triggerWebhook/TriggerWebhookUseCase.ts
import type { WebhookDelivery } from "~/admin/shared/types.js";
import {
    TriggerWebhookUseCase as UseCaseAbstraction,
    TriggerWebhookGateway
} from "./abstractions.js";

class TriggerWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: TriggerWebhookGateway.Interface) {}

    async execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery> {
        return this.gateway.execute(id, payload);
    }
}

export const TriggerWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [TriggerWebhookGateway]
});
```

- [ ] **Step 12: Create triggerWebhook feature + index**

```ts
// admin/features/triggerWebhook/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerWebhookUseCase } from "./TriggerWebhookUseCase.js";
import { TriggerWebhookGateway } from "./TriggerWebhookGateway.js";

export const TriggerWebhookFeature = createFeature({
    name: "Webhooks/TriggerWebhook",
    register(container) {
        container.register(TriggerWebhookUseCase);
        container.register(TriggerWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/triggerWebhook/index.ts
export { TriggerWebhookUseCase } from "./abstractions.js";
export { TriggerWebhookFeature } from "./feature.js";
```

### listAvailableEvents

- [ ] **Step 13: Create listAvailableEvents abstractions**

```ts
// admin/features/listAvailableEvents/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookEvent } from "~/admin/shared/types.js";

export interface IListAvailableEventsGateway {
    execute(): Promise<WebhookEvent[]>;
}

export const ListAvailableEventsGateway =
    createAbstraction<IListAvailableEventsGateway>("ListAvailableEventsGateway");

export namespace ListAvailableEventsGateway {
    export type Interface = IListAvailableEventsGateway;
}

export interface IListAvailableEventsUseCase {
    execute(): Promise<WebhookEvent[]>;
}

export const ListAvailableEventsUseCase =
    createAbstraction<IListAvailableEventsUseCase>("ListAvailableEventsUseCase");

export namespace ListAvailableEventsUseCase {
    export type Interface = IListAvailableEventsUseCase;
}
```

- [ ] **Step 14: Create ListAvailableEventsGateway**

```ts
// admin/features/listAvailableEvents/ListAvailableEventsGateway.ts
import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { WebhookEvent } from "~/admin/shared/types.js";
import { ListAvailableEventsGateway as GatewayAbstraction } from "./abstractions.js";

class ListAvailableEventsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(): Promise<WebhookEvent[]> {
        const result = await this.sdk.webhooks.listAvailableWebhookEvents();

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const ListAvailableEventsGateway = GatewayAbstraction.createImplementation({
    implementation: ListAvailableEventsGatewayImpl,
    dependencies: [WebinySdk]
});
```

- [ ] **Step 15: Create ListAvailableEventsUseCase**

```ts
// admin/features/listAvailableEvents/ListAvailableEventsUseCase.ts
import type { WebhookEvent } from "~/admin/shared/types.js";
import {
    ListAvailableEventsUseCase as UseCaseAbstraction,
    ListAvailableEventsGateway
} from "./abstractions.js";

class ListAvailableEventsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListAvailableEventsGateway.Interface) {}

    async execute(): Promise<WebhookEvent[]> {
        return this.gateway.execute();
    }
}

export const ListAvailableEventsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAvailableEventsUseCaseImpl,
    dependencies: [ListAvailableEventsGateway]
});
```

- [ ] **Step 16: Create listAvailableEvents feature + index**

```ts
// admin/features/listAvailableEvents/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { ListAvailableEventsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAvailableEventsUseCase } from "./ListAvailableEventsUseCase.js";
import { ListAvailableEventsGateway } from "./ListAvailableEventsGateway.js";

export const ListAvailableEventsFeature = createFeature({
    name: "Webhooks/ListAvailableEvents",
    register(container) {
        container.register(ListAvailableEventsUseCase);
        container.register(ListAvailableEventsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
```

```ts
// admin/features/listAvailableEvents/index.ts
export { ListAvailableEventsUseCase } from "./abstractions.js";
export { ListAvailableEventsFeature } from "./feature.js";
```

- [ ] **Step 17: Commit all delivery & event features**

```bash
git add packages/webhooks/src/admin/features/listWebhookDeliveries packages/webhooks/src/admin/features/resendWebhookDelivery packages/webhooks/src/admin/features/triggerWebhook packages/webhooks/src/admin/features/listAvailableEvents
git commit -m "feat(webhooks): add admin delivery and event features"
```

---

## Task 4: WebhookList Presentation

List presenter using shared `ListPresenter`, `WebhookListDataSource`, and the `WebhookListView` component. Depends on Tasks 1-3.

**Files:**
- Create: `admin/presentation/WebhookList/abstractions.ts`
- Create: `admin/presentation/WebhookList/WebhookListDataSource.ts`
- Create: `admin/presentation/WebhookList/WebhookListPresenter.ts`
- Create: `admin/presentation/WebhookList/feature.ts`
- Create: `admin/presentation/WebhookList/index.ts`
- Create: `admin/presentation/WebhookList/components/WebhookListView.tsx`

- [ ] **Step 1: Create WebhookList abstractions**

```ts
// admin/presentation/WebhookList/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IWebhookListViewModel {
    list: IListViewModel<Webhook>;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
}

export interface IWebhookListActions extends IListActions {
    deleteWebhook(id: string): Promise<void>;
    triggerWebhook(id: string): Promise<void>;
}

export interface IWebhookListPresenter {
    vm: IWebhookListViewModel;
    actions: IWebhookListActions;
    init(): void;
}

export const WebhookListPresenter =
    createAbstraction<IWebhookListPresenter>("WebhookListPresenter");

export namespace WebhookListPresenter {
    export type Interface = IWebhookListPresenter;
    export type ViewModel = IWebhookListViewModel;
    export type Actions = IWebhookListActions;
}
```

- [ ] **Step 2: Create WebhookListDataSource**

```ts
// admin/presentation/WebhookList/WebhookListDataSource.ts
import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import type { IListWebhooksUseCase } from "~/admin/features/listWebhooks/abstractions.js";

export class WebhookListDataSource implements IDataSource<Webhook> {
    private _rows: Webhook[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(private readonly listWebhooksUseCase: IListWebhooksUseCase) {
        makeAutoObservable<WebhookListDataSource, "listWebhooksUseCase">(this, {
            listWebhooksUseCase: false,
            rows: computed
        });
    }

    get rows(): Webhook[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;

        const result = await this.listWebhooksUseCase.execute({
            where: params.filters as { enabled?: boolean } | undefined,
            limit: params.limit,
            after: params.cursor
        });

        runInAction(() => {
            this._rows = result.data;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }

        this._loading = true;

        const result = await this.listWebhooksUseCase.execute({
            where: params.filters as { enabled?: boolean } | undefined,
            limit: params.limit,
            after: this._meta.cursor ?? undefined
        });

        runInAction(() => {
            this._rows = [...this._rows, ...result.data];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
```

- [ ] **Step 3: Create WebhookListPresenter**

```ts
// admin/presentation/WebhookList/WebhookListPresenter.ts
import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import {
    WebhookListPresenter as Abstraction,
    type IWebhookListPresenter,
    type IWebhookListViewModel,
    type IWebhookListActions
} from "./abstractions.js";
import { WebhookListDataSource } from "./WebhookListDataSource.js";
import { ListWebhooksUseCase } from "~/admin/features/listWebhooks/abstractions.js";
import { DeleteWebhookUseCase } from "~/admin/features/deleteWebhook/abstractions.js";
import { TriggerWebhookUseCase } from "~/admin/features/triggerWebhook/abstractions.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";

class WebhookListPresenterImpl implements IWebhookListPresenter {
    constructor(
        private readonly listPresenter: ListPresenter.Interface<Webhook>,
        private readonly listWebhooksUseCase: ListWebhooksUseCase.Interface,
        private readonly deleteWebhookUseCase: DeleteWebhookUseCase.Interface,
        private readonly triggerWebhookUseCase: TriggerWebhookUseCase.Interface,
        private readonly permissions: WebhookPermissions.Interface
    ) {
        makeAutoObservable(this, {
            vm: computed
        });
    }

    get vm(): IWebhookListViewModel {
        return {
            list: this.listPresenter.vm,
            permissions: {
                canRead: this.permissions.canRead("webhook"),
                canCreate: this.permissions.canCreate("webhook"),
                canEdit: this.permissions.canEdit("webhook"),
                canDelete: this.permissions.canDelete("webhook")
            }
        };
    }

    actions: IWebhookListActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh(),
        deleteWebhook: async (id: string) => {
            await this.deleteWebhookUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        },
        triggerWebhook: async (id: string) => {
            await this.triggerWebhookUseCase.execute(id, { test: true });
            await this.listPresenter.actions.refresh();
        }
    };

    init(): void {
        const dataSource = new WebhookListDataSource(this.listWebhooksUseCase);

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const WebhookListPresenter = Abstraction.createImplementation({
    implementation: WebhookListPresenterImpl,
    dependencies: [
        ListPresenter,
        ListWebhooksUseCase,
        DeleteWebhookUseCase,
        TriggerWebhookUseCase,
        WebhookPermissions
    ]
});
```

- [ ] **Step 4: Create WebhookList feature + index**

```ts
// admin/presentation/WebhookList/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { WebhookListPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookListPresenter } from "./WebhookListPresenter.js";

export const WebhookListPresenterFeature = createFeature({
    name: "Webhooks/WebhookListPresenter",
    register(container) {
        container.register(WebhookListPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
```

```ts
// admin/presentation/WebhookList/index.ts
export { WebhookListPresenter } from "./abstractions.js";
export { WebhookListPresenterFeature } from "./feature.js";
```

- [ ] **Step 5: Create WebhookListView component**

This is a React component. The exact UI components will be refined once the feature is wired up and visible in the browser. This is the structural skeleton.

```tsx
// admin/presentation/WebhookList/components/WebhookListView.tsx
import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app-admin";
import { Button, DataTable, Heading, Separator } from "@webiny/admin-ui";
import { WebhookListPresenterFeature } from "../feature.js";
import { ListWebhooksFeature } from "~/admin/features/listWebhooks/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { TriggerWebhookFeature } from "~/admin/features/triggerWebhook/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";

const WebhookListViewInner = observer(function WebhookListViewInner() {
    const { presenter } = useFeature(WebhookListPresenterFeature);
    const { navigate } = useRouter();

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const { vm, actions } = presenter;

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>Webhooks</Heading>
                {vm.permissions.canCreate && (
                    <Button
                        variant="primary"
                        onPress={() => navigate(Routes.Form, { id: "new" })}
                    >
                        Create Webhook
                    </Button>
                )}
            </div>
            <Separator />
            <div className="flex-1 overflow-auto">
                {/* DataTable will be wired once visible in browser. */}
                {/* Columns: name, endpointUrl, enabled, createdOn. */}
                {/* Row actions: Edit, Trigger, Delete. */}
            </div>
        </div>
    );
});

export const WebhookListView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        ListWebhooksFeature.register(child);
        DeleteWebhookFeature.register(child);
        TriggerWebhookFeature.register(child);
        WebhookPermissionsFeature.register(child);
        WebhookListPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookListViewInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookList
git commit -m "feat(webhooks): add WebhookList presentation — presenter, datasource, view"
```

---

## Task 5: WebhookForm Presentation

Form presenter using `FormModel`, managing load/save lifecycle. Depends on Tasks 1-3.

**Files:**
- Create: `admin/presentation/WebhookForm/abstractions.ts`
- Create: `admin/presentation/WebhookForm/WebhookFormPresenter.ts`
- Create: `admin/presentation/WebhookForm/feature.ts`
- Create: `admin/presentation/WebhookForm/index.ts`
- Create: `admin/presentation/WebhookForm/components/WebhookFormView.tsx`

- [ ] **Step 1: Create WebhookForm abstractions**

```ts
// admin/presentation/WebhookForm/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";
import type { WebhookEvent } from "~/admin/shared/types.js";

export interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: Webhook | null;
    showDeliveries: boolean;
    availableEvents: WebhookEvent[];
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
}

export interface IWebhookFormActions {
    save(): Promise<void>;
    deleteWebhook(): Promise<void>;
    openDeliveries(): void;
    closeDeliveries(): void;
}

export interface IWebhookFormPresenter {
    vm: IWebhookFormViewModel;
    actions: IWebhookFormActions;
    init(id: string): void;
}

export const WebhookFormPresenter =
    createAbstraction<IWebhookFormPresenter>("WebhookFormPresenter");

export namespace WebhookFormPresenter {
    export type Interface = IWebhookFormPresenter;
    export type ViewModel = IWebhookFormViewModel;
    export type Actions = IWebhookFormActions;
}
```

- [ ] **Step 2: Create WebhookFormPresenter**

```ts
// admin/presentation/WebhookForm/WebhookFormPresenter.ts
import { makeAutoObservable, runInAction, computed } from "mobx";
import type { Webhook } from "~/admin/shared/types.js";
import type { WebhookEvent } from "~/admin/shared/types.js";
import {
    WebhookFormPresenter as Abstraction,
    type IWebhookFormPresenter,
    type IWebhookFormViewModel,
    type IWebhookFormActions
} from "./abstractions.js";
import { GetWebhookUseCase } from "~/admin/features/getWebhook/abstractions.js";
import { CreateWebhookUseCase } from "~/admin/features/createWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/admin/features/updateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/admin/features/deleteWebhook/abstractions.js";
import { ListAvailableEventsUseCase } from "~/admin/features/listAvailableEvents/abstractions.js";
import { WebhookPermissions } from "~/admin/features/permissions/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";

class WebhookFormPresenterImpl implements IWebhookFormPresenter {
    private _loading = false;
    private _saving = false;
    private _isNew = false;
    private _webhook: Webhook | null = null;
    private _showDeliveries = false;
    private _availableEvents: WebhookEvent[] = [];
    private _webhookId: string | null = null;

    constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly getWebhookUseCase: GetWebhookUseCase.Interface,
        private readonly createWebhookUseCase: CreateWebhookUseCase.Interface,
        private readonly updateWebhookUseCase: UpdateWebhookUseCase.Interface,
        private readonly deleteWebhookUseCase: DeleteWebhookUseCase.Interface,
        private readonly listAvailableEventsUseCase: ListAvailableEventsUseCase.Interface,
        private readonly permissions: WebhookPermissions.Interface
    ) {
        makeAutoObservable(this, {
            vm: computed
        });
    }

    get vm(): IWebhookFormViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            isNew: this._isNew,
            webhook: this._webhook,
            showDeliveries: this._showDeliveries,
            availableEvents: this._availableEvents,
            permissions: {
                canEdit: this.permissions.canEdit("webhook"),
                canDelete: this.permissions.canDelete("webhook")
            }
        };
    }

    actions: IWebhookFormActions = {
        save: async () => {
            this._saving = true;
            /* FormModel submit + create/update will be wired here. */
            runInAction(() => {
                this._saving = false;
            });
        },
        deleteWebhook: async () => {
            if (!this._webhookId || this._isNew) {
                return;
            }
            await this.deleteWebhookUseCase.execute(this._webhookId);
        },
        openDeliveries: () => {
            this._showDeliveries = true;
        },
        closeDeliveries: () => {
            this._showDeliveries = false;
        }
    };

    async init(id: string): Promise<void> {
        this._loading = true;
        this._isNew = id === "new";
        this._webhookId = id === "new" ? null : id;

        const eventsPromise = this.listAvailableEventsUseCase.execute();

        if (!this._isNew) {
            const [webhook, events] = await Promise.all([
                this.getWebhookUseCase.execute(id),
                eventsPromise
            ]);

            runInAction(() => {
                this._webhook = webhook;
                this._availableEvents = events;
                this._loading = false;
            });
        } else {
            const events = await eventsPromise;

            runInAction(() => {
                this._availableEvents = events;
                this._loading = false;
            });
        }
    }
}

export const WebhookFormPresenter = Abstraction.createImplementation({
    implementation: WebhookFormPresenterImpl,
    dependencies: [
        FormModelFactory,
        GetWebhookUseCase,
        CreateWebhookUseCase,
        UpdateWebhookUseCase,
        DeleteWebhookUseCase,
        ListAvailableEventsUseCase,
        WebhookPermissions
    ]
});
```

- [ ] **Step 3: Create WebhookForm feature + index**

```ts
// admin/presentation/WebhookForm/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { WebhookFormPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookFormPresenter } from "./WebhookFormPresenter.js";

export const WebhookFormPresenterFeature = createFeature({
    name: "Webhooks/WebhookFormPresenter",
    register(container) {
        container.register(WebhookFormPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
```

```ts
// admin/presentation/WebhookForm/index.ts
export { WebhookFormPresenter } from "./abstractions.js";
export { WebhookFormPresenterFeature } from "./feature.js";
```

- [ ] **Step 4: Create WebhookFormView component**

```tsx
// admin/presentation/WebhookForm/components/WebhookFormView.tsx
import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app-admin";
import { Button, Heading, OverlayLoader, Separator } from "@webiny/admin-ui";
import { WebhookFormPresenterFeature } from "../feature.js";
import { GetWebhookFeature } from "~/admin/features/getWebhook/feature.js";
import { CreateWebhookFeature } from "~/admin/features/createWebhook/feature.js";
import { UpdateWebhookFeature } from "~/admin/features/updateWebhook/feature.js";
import { DeleteWebhookFeature } from "~/admin/features/deleteWebhook/feature.js";
import { ListAvailableEventsFeature } from "~/admin/features/listAvailableEvents/feature.js";
import { WebhookPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { Routes } from "~/admin/routes.js";

const WebhookFormViewInner = observer(function WebhookFormViewInner() {
    const { presenter } = useFeature(WebhookFormPresenterFeature);
    const { params, navigate } = useRouter();
    const id = params.id as string;

    useEffect(() => {
        void presenter.init(id);
    }, [presenter, id]);

    const { vm, actions } = presenter;

    if (vm.loading) {
        return <OverlayLoader />;
    }

    return (
        <div className="flex flex-col h-main-content">
            <div className="flex items-center justify-between py-sm px-md">
                <Heading level={5}>
                    {vm.isNew ? "Create Webhook" : vm.webhook?.name ?? "Edit Webhook"}
                </Heading>
                <div className="flex gap-sm">
                    {!vm.isNew && (
                        <Button
                            variant="secondary"
                            onPress={() => actions.openDeliveries()}
                        >
                            Deliveries
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        onPress={() => navigate(Routes.List)}
                    >
                        Cancel
                    </Button>
                    {vm.permissions.canEdit && (
                        <Button
                            variant="primary"
                            onPress={() => void actions.save()}
                            disabled={vm.saving}
                        >
                            {vm.saving ? "Saving..." : "Save"}
                        </Button>
                    )}
                </div>
            </div>
            <Separator />
            <div className="flex-1 overflow-auto p-md">
                {/* FormModel renderer will be wired here. */}
                {/* Fields: name, slug, endpointUrl, description, enabled, events. */}
                {/* Signing secret shown read-only for existing webhooks. */}
            </div>
        </div>
    );
});

export const WebhookFormView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        GetWebhookFeature.register(child);
        CreateWebhookFeature.register(child);
        UpdateWebhookFeature.register(child);
        DeleteWebhookFeature.register(child);
        ListAvailableEventsFeature.register(child);
        WebhookPermissionsFeature.register(child);
        WebhookFormPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookFormViewInner />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookForm
git commit -m "feat(webhooks): add WebhookForm presentation — presenter, view"
```

---

## Task 6: WebhookDeliveries Presentation

Deliveries drawer with its own list presenter and datasource. Depends on Tasks 1 and 3.

**Files:**
- Create: `admin/presentation/WebhookDeliveries/abstractions.ts`
- Create: `admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts`
- Create: `admin/presentation/WebhookDeliveries/WebhookDeliveriesPresenter.ts`
- Create: `admin/presentation/WebhookDeliveries/feature.ts`
- Create: `admin/presentation/WebhookDeliveries/index.ts`
- Create: `admin/presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.tsx`

- [ ] **Step 1: Create WebhookDeliveries abstractions**

```ts
// admin/presentation/WebhookDeliveries/abstractions.ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IWebhookDeliveriesViewModel {
    list: IListViewModel<WebhookDelivery>;
    selectedDelivery: WebhookDelivery | null;
}

export interface IWebhookDeliveriesActions extends IListActions {
    resend(id: string): Promise<void>;
    selectDelivery(delivery: WebhookDelivery | null): void;
}

export interface IWebhookDeliveriesPresenter {
    vm: IWebhookDeliveriesViewModel;
    actions: IWebhookDeliveriesActions;
    init(webhookId: string): void;
}

export const WebhookDeliveriesPresenter =
    createAbstraction<IWebhookDeliveriesPresenter>("WebhookDeliveriesPresenter");

export namespace WebhookDeliveriesPresenter {
    export type Interface = IWebhookDeliveriesPresenter;
    export type ViewModel = IWebhookDeliveriesViewModel;
    export type Actions = IWebhookDeliveriesActions;
}
```

- [ ] **Step 2: Create WebhookDeliveriesDataSource**

```ts
// admin/presentation/WebhookDeliveries/WebhookDeliveriesDataSource.ts
import { makeAutoObservable, runInAction, computed } from "mobx";
import type {
    IDataSource,
    IDataSourceQuery,
    IDataSourceMeta
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";

export class WebhookDeliveriesDataSource implements IDataSource<WebhookDelivery> {
    private _rows: WebhookDelivery[] = [];
    private _meta: IDataSourceMeta = { cursor: null, hasMoreItems: false, totalCount: 0 };
    private _loading = false;

    constructor(
        private readonly listDeliveriesUseCase: IListWebhookDeliveriesUseCase,
        private readonly webhookId: string
    ) {
        makeAutoObservable<WebhookDeliveriesDataSource, "listDeliveriesUseCase">(this, {
            listDeliveriesUseCase: false,
            rows: computed
        });
    }

    get rows(): WebhookDelivery[] {
        return this._rows;
    }

    get meta(): IDataSourceMeta {
        return this._meta;
    }

    get loading(): boolean {
        return this._loading;
    }

    async query(params: IDataSourceQuery): Promise<void> {
        this._loading = true;

        const result = await this.listDeliveriesUseCase.execute({
            webhookId: this.webhookId,
            limit: params.limit,
            after: params.cursor
        });

        runInAction(() => {
            this._rows = result.data;
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }

    async loadMore(params: IDataSourceQuery): Promise<void> {
        if (!this._meta.hasMoreItems || this._loading) {
            return;
        }

        this._loading = true;

        const result = await this.listDeliveriesUseCase.execute({
            webhookId: this.webhookId,
            limit: params.limit,
            after: this._meta.cursor ?? undefined
        });

        runInAction(() => {
            this._rows = [...this._rows, ...result.data];
            this._meta = {
                cursor: result.meta.cursor,
                hasMoreItems: result.meta.hasMoreItems,
                totalCount: result.meta.totalCount
            };
            this._loading = false;
        });
    }
}
```

- [ ] **Step 3: Create WebhookDeliveriesPresenter**

```ts
// admin/presentation/WebhookDeliveries/WebhookDeliveriesPresenter.ts
import { makeAutoObservable, computed } from "mobx";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import {
    WebhookDeliveriesPresenter as Abstraction,
    type IWebhookDeliveriesPresenter,
    type IWebhookDeliveriesViewModel,
    type IWebhookDeliveriesActions
} from "./abstractions.js";
import { WebhookDeliveriesDataSource } from "./WebhookDeliveriesDataSource.js";
import { ListWebhookDeliveriesUseCase } from "~/admin/features/listWebhookDeliveries/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/admin/features/resendWebhookDelivery/abstractions.js";

class WebhookDeliveriesPresenterImpl implements IWebhookDeliveriesPresenter {
    private _selectedDelivery: WebhookDelivery | null = null;

    constructor(
        private readonly listPresenter: ListPresenter.Interface<WebhookDelivery>,
        private readonly listDeliveriesUseCase: ListWebhookDeliveriesUseCase.Interface,
        private readonly resendDeliveryUseCase: ResendWebhookDeliveryUseCase.Interface
    ) {
        makeAutoObservable(this, {
            vm: computed
        });
    }

    get vm(): IWebhookDeliveriesViewModel {
        return {
            list: this.listPresenter.vm,
            selectedDelivery: this._selectedDelivery
        };
    }

    actions: IWebhookDeliveriesActions = {
        search: {
            set: (query: string) => this.listPresenter.actions.search.set(query),
            clear: () => this.listPresenter.actions.search.clear()
        },
        sort: {
            set: (field: string, direction: "ASC" | "DESC") =>
                this.listPresenter.actions.sort.set(field, direction),
            toggle: (field: string) => this.listPresenter.actions.sort.toggle(field)
        },
        filter: {
            set: (key: string, value: unknown) => this.listPresenter.actions.filter.set(key, value),
            clear: (key: string) => this.listPresenter.actions.filter.clear(key),
            clearAll: () => this.listPresenter.actions.filter.clearAll()
        },
        selection: {
            toggle: (id: string) => this.listPresenter.actions.selection.toggle(id),
            selectRangeTo: (id: string) => this.listPresenter.actions.selection.selectRangeTo(id),
            selectAll: () => this.listPresenter.actions.selection.selectAll(),
            deselectAll: () => this.listPresenter.actions.selection.deselectAll(),
            selectRows: (ids: string[]) => this.listPresenter.actions.selection.selectRows(ids),
            isSelected: (id: string) => this.listPresenter.actions.selection.isSelected(id)
        },
        loadMore: () => this.listPresenter.actions.loadMore(),
        refresh: () => this.listPresenter.actions.refresh(),
        resend: async (id: string) => {
            await this.resendDeliveryUseCase.execute(id);
            await this.listPresenter.actions.refresh();
        },
        selectDelivery: (delivery: WebhookDelivery | null) => {
            this._selectedDelivery = delivery;
        }
    };

    init(webhookId: string): void {
        const dataSource = new WebhookDeliveriesDataSource(
            this.listDeliveriesUseCase,
            webhookId
        );

        this.listPresenter.init({
            dataSource,
            initialSort: { field: "createdOn", direction: "DESC" },
            limit: 20
        });
    }
}

export const WebhookDeliveriesPresenter = Abstraction.createImplementation({
    implementation: WebhookDeliveriesPresenterImpl,
    dependencies: [
        ListPresenter,
        ListWebhookDeliveriesUseCase,
        ResendWebhookDeliveryUseCase
    ]
});
```

- [ ] **Step 4: Create WebhookDeliveries feature + index**

```ts
// admin/presentation/WebhookDeliveries/feature.ts
import { createFeature } from "@webiny/feature/admin";
import { WebhookDeliveriesPresenter as PresenterAbstraction } from "./abstractions.js";
import { WebhookDeliveriesPresenter } from "./WebhookDeliveriesPresenter.js";

export const WebhookDeliveriesPresenterFeature = createFeature({
    name: "Webhooks/WebhookDeliveriesPresenter",
    register(container) {
        container.register(WebhookDeliveriesPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
```

```ts
// admin/presentation/WebhookDeliveries/index.ts
export { WebhookDeliveriesPresenter } from "./abstractions.js";
export { WebhookDeliveriesPresenterFeature } from "./feature.js";
```

- [ ] **Step 5: Create WebhookDeliveriesDrawer component**

```tsx
// admin/presentation/WebhookDeliveries/components/WebhookDeliveriesDrawer.tsx
import React, { useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Drawer, Heading } from "@webiny/admin-ui";
import { WebhookDeliveriesPresenterFeature } from "../feature.js";
import { ListWebhookDeliveriesFeature } from "~/admin/features/listWebhookDeliveries/feature.js";
import { ResendWebhookDeliveryFeature } from "~/admin/features/resendWebhookDelivery/feature.js";

interface WebhookDeliveriesDrawerProps {
    webhookId: string;
    open: boolean;
    onClose: () => void;
}

const WebhookDeliveriesDrawerInner = observer(function WebhookDeliveriesDrawerInner({
    webhookId,
    open,
    onClose
}: WebhookDeliveriesDrawerProps) {
    const { presenter } = useFeature(WebhookDeliveriesPresenterFeature);

    useEffect(() => {
        if (open) {
            presenter.init(webhookId);
        }
    }, [presenter, webhookId, open]);

    const { vm, actions } = presenter;

    return (
        <Drawer open={open} onOpenChange={isOpen => !isOpen && onClose()}>
            <Drawer.Content>
                <Drawer.Header>
                    <Heading level={5}>Delivery Log</Heading>
                </Drawer.Header>
                <Drawer.Body>
                    {/* Delivery list with status badges, resend buttons. */}
                    {/* Each row: eventType, status, createdOn, responseStatus. */}
                    {/* Selected delivery detail: payload, headers, response. */}
                </Drawer.Body>
            </Drawer.Content>
        </Drawer>
    );
});

export const WebhookDeliveriesDrawer = (props: WebhookDeliveriesDrawerProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        ListWebhookDeliveriesFeature.register(child);
        ResendWebhookDeliveryFeature.register(child);
        WebhookDeliveriesPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <WebhookDeliveriesDrawerInner {...props} />
        </DiContainerProvider>
    );
};
```

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/admin/presentation/WebhookDeliveries
git commit -m "feat(webhooks): add WebhookDeliveries presentation — presenter, datasource, drawer"
```

---

## Task 7: Extension Wiring

The top-level `Extension.tsx`, `WebhookRoutes.tsx`, and the export file. Depends on all previous tasks.

**Files:**
- Create: `admin/Extension.tsx`
- Create: `admin/WebhookRoutes.tsx`
- Create: `src/exports/admin/webhooks.ts`

- [ ] **Step 1: Create WebhookRoutes**

```tsx
// admin/WebhookRoutes.tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { WebhookListView } from "./presentation/WebhookList/components/WebhookListView.js";
import { WebhookFormView } from "./presentation/WebhookForm/components/WebhookFormView.js";
import { Routes } from "./routes.js";

const { Menu, Route } = AdminConfig;

export const WebhookRoutes = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            <HasPermission entity="webhook">
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookListView />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Form}
                    element={
                        <AdminLayout title="Webhooks">
                            <WebhookFormView />
                        </AdminLayout>
                    }
                />
                <Menu
                    name="webhooks"
                    after="settings"
                    element={
                        <Menu.Link
                            text="Webhooks"
                            to={getLink(Routes.List)}
                        />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};
```

- [ ] **Step 2: Create Extension.tsx**

```tsx
// admin/Extension.tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { ListWebhooksFeature } from "./features/listWebhooks/index.js";
import { GetWebhookFeature } from "./features/getWebhook/index.js";
import { CreateWebhookFeature } from "./features/createWebhook/index.js";
import { UpdateWebhookFeature } from "./features/updateWebhook/index.js";
import { DeleteWebhookFeature } from "./features/deleteWebhook/index.js";
import { ListWebhookDeliveriesFeature } from "./features/listWebhookDeliveries/index.js";
import { TriggerWebhookFeature } from "./features/triggerWebhook/index.js";
import { ResendWebhookDeliveryFeature } from "./features/resendWebhookDelivery/index.js";
import { ListAvailableEventsFeature } from "./features/listAvailableEvents/index.js";
import { WebhookPermissionsFeature } from "./features/permissions/index.js";
import { WebhookListPresenterFeature } from "./presentation/WebhookList/index.js";
import { WebhookFormPresenterFeature } from "./presentation/WebhookForm/index.js";
import { WebhookDeliveriesPresenterFeature } from "./presentation/WebhookDeliveries/index.js";
import { WebhookRoutes } from "./WebhookRoutes.js";
import { WEBHOOK_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const Extension = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={ListWebhooksFeature} />
            <RegisterFeature feature={GetWebhookFeature} />
            <RegisterFeature feature={CreateWebhookFeature} />
            <RegisterFeature feature={UpdateWebhookFeature} />
            <RegisterFeature feature={DeleteWebhookFeature} />
            <RegisterFeature feature={ListWebhookDeliveriesFeature} />
            <RegisterFeature feature={TriggerWebhookFeature} />
            <RegisterFeature feature={ResendWebhookDeliveryFeature} />
            <RegisterFeature feature={ListAvailableEventsFeature} />
            <RegisterFeature feature={WebhookPermissionsFeature} />
            {/* Presentation features. */}
            <RegisterFeature feature={WebhookListPresenterFeature} />
            <RegisterFeature feature={WebhookFormPresenterFeature} />
            <RegisterFeature feature={WebhookDeliveriesPresenterFeature} />
            {/* Routes + menu. */}
            <WebhookRoutes />
            {/* Security permissions UI. */}
            <AdminConfig>
                <Security.Permissions
                    name="webhooks"
                    title="Webhooks"
                    description="Manage webhook permissions."
                    schema={WEBHOOK_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
```

- [ ] **Step 3: Create admin export**

```ts
// src/exports/admin/webhooks.ts
export { Extension } from "../../admin/Extension.js";
```

- [ ] **Step 4: Run pre-commit checks**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/src/admin/Extension.tsx packages/webhooks/src/admin/WebhookRoutes.tsx packages/webhooks/src/exports/admin
git commit -m "feat(webhooks): add admin Extension, routes, and export wiring"
```

---

## Notes

- **UI components are structural skeletons.** The exact `DataTable` columns, `FormModel` field rendering, and `Drawer` content will be refined once the features are wired and visible in the browser. The presenters and data flow are complete.
- **The `FormModel` integration in `WebhookFormPresenter`** needs the `buildForm()` method wired into `init()` and `actions.save()` once we verify the `FormModelFactory` API at runtime. The spec documents the intended field definitions.
- **No unit tests for features layer** — these are thin delegation wrappers (gateway → SDK, usecase → gateway). Tests would be testing the framework, not our code. Presenter tests can be added in a follow-up phase.
