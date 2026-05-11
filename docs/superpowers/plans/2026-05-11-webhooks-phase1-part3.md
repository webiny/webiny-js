# Webhooks Phase 1 — `api-webhooks` Core Package (Part 3 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 11 use cases: Webhook CRUD (5), Delivery log (4), and Secret + Events (3). Each use case follows the pattern: `abstractions.ts` → `UseCase.ts` → `Repository.ts` → `feature.ts`.

**Part 1:** `2026-05-11-webhooks-phase1-part1.md` — scaffold, domain, abstractions, models (complete first)
**Part 2:** `2026-05-11-webhooks-phase1-part2.md` — implementations + tests (complete first)
**Part 4:** `2026-05-11-webhooks-phase1-part4.md` — GraphQL + Extension + exports

---

## Task 8: Webhook CRUD use cases

### 8a: `CreateWebhook`

Validates the endpoint URL (HTTPS required, localhost HTTP allowed) and that at least one event is selected. Auto-derives slug from name when slug is empty. Slug must be unique per tenant.

**Files:**
- Create: `packages/api-webhooks/src/features/CreateWebhook/abstractions.ts`
- Create: `packages/api-webhooks/src/features/CreateWebhook/CreateWebhookUseCase.ts`
- Create: `packages/api-webhooks/src/features/CreateWebhook/CreateWebhookRepository.ts`
- Create: `packages/api-webhooks/src/features/CreateWebhook/feature.ts`

- [ ] **Step 1: Create `src/features/CreateWebhook/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhook } from "~/domain/types.js";
import type {
    WebhookNotFoundError,
    WebhookPersistenceError,
    WebhookValidationError,
    WebhookModelNotFoundError
} from "~/domain/errors.js";

export interface ICreateWebhookInput {
    name: string;
    slug?: string;
    endpointUrl: string;
    description?: string;
    enabled?: boolean;
    events: string[];
}

type IError =
    | WebhookValidationError
    | WebhookPersistenceError
    | WebhookModelNotFoundError;

export interface ICreateWebhookUseCase {
    execute(input: ICreateWebhookInput): Promise<Result<IWebhook, IError>>;
}

export const CreateWebhookUseCase = createAbstraction<ICreateWebhookUseCase>(
    "Webhooks/CreateWebhookUseCase"
);
export namespace CreateWebhookUseCase {
    export type Interface = ICreateWebhookUseCase;
    export type Input = ICreateWebhookInput;
    export type Error = IError;
}

export interface ICreateWebhookRepository {
    execute(webhook: IWebhook): Promise<Result<IWebhook, WebhookPersistenceError | WebhookModelNotFoundError>>;
    slugExists(slug: string): Promise<boolean>;
}

export const CreateWebhookRepository = createAbstraction<ICreateWebhookRepository>(
    "Webhooks/CreateWebhookRepository"
);
export namespace CreateWebhookRepository {
    export type Interface = ICreateWebhookRepository;
}
```

- [ ] **Step 2: Create `src/features/CreateWebhook/CreateWebhookUseCase.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import { CreateWebhookUseCase as UseCaseAbstraction, CreateWebhookRepository } from "./abstractions.js";
import { WebhookValidationError } from "~/domain/errors.js";
import type { IWebhook } from "~/domain/types.js";
import { randomBytes } from "node:crypto";

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64);
};

const isValidEndpointUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") return true;
        // Allow http://localhost and http://127.0.0.1 for local dev
        if (
            parsed.protocol === "http:" &&
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
        ) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

class CreateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateWebhookRepository.Interface) {}

    async execute(input: UseCaseAbstraction.Input): Promise<Result<IWebhook, UseCaseAbstraction.Error>> {
        if (!isValidEndpointUrl(input.endpointUrl)) {
            return Result.fail(
                new WebhookValidationError(
                    "Endpoint URL must use HTTPS. HTTP is only allowed for localhost."
                )
            );
        }

        if (!input.events || input.events.length === 0) {
            return Result.fail(
                new WebhookValidationError("At least one event must be selected.")
            );
        }

        let slug = (input.slug || "").trim();
        if (!slug) {
            slug = generateSlug(input.name);
        }

        // Ensure unique slug
        let candidate = slug;
        let attempt = 0;
        while (await this.repository.slugExists(candidate)) {
            attempt++;
            candidate = `${slug}-${attempt}`;
        }

        const webhook: IWebhook = {
            id: randomBytes(8).toString("hex"),
            values: {
                name: input.name,
                slug: candidate,
                endpointUrl: input.endpointUrl,
                description: input.description,
                enabled: input.enabled ?? true,
                events: input.events
            }
        };

        return this.repository.execute(webhook);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: CreateWebhookUseCaseImpl,
    dependencies: [CreateWebhookRepository]
});
```

- [ ] **Step 3: Create `src/features/CreateWebhook/CreateWebhookRepository.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/domain/constants.js";
import type { IWebhook } from "~/domain/types.js";

class CreateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface
    ) {}

    async slugExists(slug: string): Promise<boolean> {
        const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
        if (modelResult.isFail()) return false;

        const listResult = await this.listEntriesUseCase.execute(modelResult.value, {
            where: { values: { slug } },
            limit: 1
        });
        if (listResult.isFail()) return false;

        return listResult.value.items.length > 0;
    }

    async execute(webhook: IWebhook): Promise<Result<IWebhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const createResult = await this.createEntryUseCase.execute(modelResult.value, {
                id: webhook.id,
                values: webhook.values
            });

            if (createResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            return Result.ok(webhook);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookRepositoryImpl,
    dependencies: [GetModelUseCase, CreateEntryUseCase, ListEntriesUseCase]
});
```

- [ ] **Step 4: Create `src/features/CreateWebhook/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import CreateWebhookUseCaseImpl from "./CreateWebhookUseCase.js";
import CreateWebhookRepositoryImpl from "./CreateWebhookRepository.js";

export const CreateWebhookFeature = createFeature({
    name: "CreateWebhook",
    register(container) {
        container.register(CreateWebhookUseCaseImpl);
        container.register(CreateWebhookRepositoryImpl).inSingletonScope();
    }
});
```

---

### 8b: `GetWebhook`

**Files:**
- Create: `packages/api-webhooks/src/features/GetWebhook/abstractions.ts`
- Create: `packages/api-webhooks/src/features/GetWebhook/GetWebhookUseCase.ts`
- Create: `packages/api-webhooks/src/features/GetWebhook/GetWebhookRepository.ts`
- Create: `packages/api-webhooks/src/features/GetWebhook/feature.ts`

- [ ] **Step 5: Create `src/features/GetWebhook/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhook } from "~/domain/types.js";
import type {
    WebhookNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/domain/errors.js";

type IError = WebhookNotFoundError | WebhookModelNotFoundError | WebhookPersistenceError;

export interface IGetWebhookUseCase {
    execute(id: string): Promise<Result<IWebhook, IError>>;
}

export const GetWebhookUseCase = createAbstraction<IGetWebhookUseCase>(
    "Webhooks/GetWebhookUseCase"
);
export namespace GetWebhookUseCase {
    export type Interface = IGetWebhookUseCase;
    export type Error = IError;
}

export interface IGetWebhookRepository {
    execute(id: string): Promise<Result<IWebhook, IError>>;
}

export const GetWebhookRepository = createAbstraction<IGetWebhookRepository>(
    "Webhooks/GetWebhookRepository"
);
export namespace GetWebhookRepository {
    export type Interface = IGetWebhookRepository;
    export type Error = IError;
}
```

- [ ] **Step 6: Create `src/features/GetWebhook/GetWebhookUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetWebhookUseCase as UseCaseAbstraction, GetWebhookRepository } from "./abstractions.js";
import type { IWebhook } from "~/domain/types.js";

class GetWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetWebhookRepository.Interface) {}

    async execute(id: string): Promise<Result<IWebhook, UseCaseAbstraction.Error>> {
        return this.repository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetWebhookUseCaseImpl,
    dependencies: [GetWebhookRepository]
});
```

- [ ] **Step 7: Create `src/features/GetWebhook/GetWebhookRepository.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/domain/constants.js";
import type { IWebhook, IWebhookValues } from "~/domain/types.js";

class GetWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<IWebhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const entryResult = await this.getLatestRevision.execute<IWebhookValues>(
                modelResult.value,
                { id }
            );

            if (entryResult.isFail()) {
                return Result.fail(new WebhookNotFoundError(id));
            }

            const entry = entryResult.value;
            return Result.ok({
                id: entry.entryId,
                values: entry.values,
                createdOn: entry.createdOn,
                modifiedOn: entry.savedOn
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: GetWebhookRepositoryImpl,
    dependencies: [GetModelUseCase, GetLatestRevisionByEntryIdUseCase]
});
```

- [ ] **Step 8: Create `src/features/GetWebhook/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import GetWebhookUseCaseImpl from "./GetWebhookUseCase.js";
import GetWebhookRepositoryImpl from "./GetWebhookRepository.js";

export const GetWebhookFeature = createFeature({
    name: "GetWebhook",
    register(container) {
        container.register(GetWebhookUseCaseImpl);
        container.register(GetWebhookRepositoryImpl).inSingletonScope();
    }
});
```

---

### 8c: `ListWebhooks`

**Files:**
- Create: `packages/api-webhooks/src/features/ListWebhooks/abstractions.ts`
- Create: `packages/api-webhooks/src/features/ListWebhooks/ListWebhooksUseCase.ts`
- Create: `packages/api-webhooks/src/features/ListWebhooks/ListWebhooksRepository.ts`
- Create: `packages/api-webhooks/src/features/ListWebhooks/feature.ts`

- [ ] **Step 9: Create `src/features/ListWebhooks/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhook, IListWebhooksInput, IListMeta } from "~/domain/types.js";
import type { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";

type IError = WebhookModelNotFoundError | WebhookPersistenceError;

export interface IListWebhooksOutput {
    items: IWebhook[];
    meta: IListMeta;
}

export interface IListWebhooksUseCase {
    execute(input?: IListWebhooksInput): Promise<Result<IListWebhooksOutput, IError>>;
}

export const ListWebhooksUseCase = createAbstraction<IListWebhooksUseCase>(
    "Webhooks/ListWebhooksUseCase"
);
export namespace ListWebhooksUseCase {
    export type Interface = IListWebhooksUseCase;
    export type Output = IListWebhooksOutput;
    export type Error = IError;
}

export interface IListWebhooksRepository {
    execute(input?: IListWebhooksInput): Promise<Result<IListWebhooksOutput, IError>>;
}

export const ListWebhooksRepository = createAbstraction<IListWebhooksRepository>(
    "Webhooks/ListWebhooksRepository"
);
export namespace ListWebhooksRepository {
    export type Interface = IListWebhooksRepository;
    export type Output = IListWebhooksOutput;
    export type Error = IError;
}
```

- [ ] **Step 10: Create `src/features/ListWebhooks/ListWebhooksUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import {
    ListWebhooksUseCase as UseCaseAbstraction,
    ListWebhooksRepository
} from "./abstractions.js";
import type { IListWebhooksInput } from "~/domain/types.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListWebhooksRepository.Interface) {}

    async execute(input?: IListWebhooksInput) {
        return this.repository.execute(input);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [ListWebhooksRepository]
});
```

- [ ] **Step 11: Create `src/features/ListWebhooks/ListWebhooksRepository.ts`**

The `events` filter uses `events_in: [eventName]` because `events` is a multi-value text field. This checks if the array contains the given value.

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListWebhooksRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/domain/constants.js";
import type { IWebhookValues, IListWebhooksInput } from "~/domain/types.js";

class ListWebhooksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface
    ) {}

    async execute(input?: IListWebhooksInput): Promise<Result<RepositoryAbstraction.Output, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const valuesWhere: Record<string, unknown> = {};
            if (input?.where?.enabled !== undefined) {
                valuesWhere.enabled = input.where.enabled;
            }
            if (input?.where?.events) {
                // events_in checks if the multi-value text field contains this value
                valuesWhere.events_in = [input.where.events];
            }

            const listResult = await this.listEntriesUseCase.execute<IWebhookValues>(
                modelResult.value,
                {
                    where: { values: valuesWhere },
                    limit: input?.limit ?? 100,
                    after: input?.after
                }
            );

            if (listResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(listResult.error as any));
            }

            const { items, meta } = listResult.value;
            return Result.ok({
                items: items.map(entry => ({
                    id: entry.entryId,
                    values: entry.values,
                    createdOn: entry.createdOn,
                    modifiedOn: entry.savedOn
                })),
                meta: {
                    cursor: meta.cursor ?? null,
                    hasMoreItems: meta.hasMoreItems,
                    totalCount: meta.totalCount
                }
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: ListWebhooksRepositoryImpl,
    dependencies: [GetModelUseCase, ListEntriesUseCase]
});
```

- [ ] **Step 12: Create `src/features/ListWebhooks/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import ListWebhooksUseCaseImpl from "./ListWebhooksUseCase.js";
import ListWebhooksRepositoryImpl from "./ListWebhooksRepository.js";

export const ListWebhooksFeature = createFeature({
    name: "ListWebhooks",
    register(container) {
        container.register(ListWebhooksUseCaseImpl);
        container.register(ListWebhooksRepositoryImpl).inSingletonScope();
    }
});
```

---

### 8d: `UpdateWebhook`

**Files:**
- Create: `packages/api-webhooks/src/features/UpdateWebhook/abstractions.ts`
- Create: `packages/api-webhooks/src/features/UpdateWebhook/UpdateWebhookUseCase.ts`
- Create: `packages/api-webhooks/src/features/UpdateWebhook/UpdateWebhookRepository.ts`
- Create: `packages/api-webhooks/src/features/UpdateWebhook/feature.ts`

- [ ] **Step 13: Create `src/features/UpdateWebhook/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhook } from "~/domain/types.js";
import type {
    WebhookNotFoundError,
    WebhookValidationError,
    WebhookPersistenceError,
    WebhookModelNotFoundError
} from "~/domain/errors.js";

export interface IUpdateWebhookInput {
    name?: string;
    slug?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
}

type IError =
    | WebhookNotFoundError
    | WebhookValidationError
    | WebhookPersistenceError
    | WebhookModelNotFoundError;

export interface IUpdateWebhookUseCase {
    execute(id: string, input: IUpdateWebhookInput): Promise<Result<IWebhook, IError>>;
}

export const UpdateWebhookUseCase = createAbstraction<IUpdateWebhookUseCase>(
    "Webhooks/UpdateWebhookUseCase"
);
export namespace UpdateWebhookUseCase {
    export type Interface = IUpdateWebhookUseCase;
    export type Input = IUpdateWebhookInput;
    export type Error = IError;
}

export interface IUpdateWebhookRepository {
    execute(webhook: IWebhook): Promise<Result<IWebhook, WebhookPersistenceError | WebhookModelNotFoundError>>;
}

export const UpdateWebhookRepository = createAbstraction<IUpdateWebhookRepository>(
    "Webhooks/UpdateWebhookRepository"
);
export namespace UpdateWebhookRepository {
    export type Interface = IUpdateWebhookRepository;
}
```

- [ ] **Step 14: Create `src/features/UpdateWebhook/UpdateWebhookUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import {
    UpdateWebhookUseCase as UseCaseAbstraction,
    UpdateWebhookRepository
} from "./abstractions.js";
import { GetWebhookRepository } from "~/features/GetWebhook/abstractions.js";
import { WebhookValidationError } from "~/domain/errors.js";
import type { IWebhook } from "~/domain/types.js";

const isValidEndpointUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "https:") return true;
        if (
            parsed.protocol === "http:" &&
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
        ) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

class UpdateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getWebhookRepository: GetWebhookRepository.Interface,
        private updateRepository: UpdateWebhookRepository.Interface
    ) {}

    async execute(id: string, input: UseCaseAbstraction.Input): Promise<Result<IWebhook, UseCaseAbstraction.Error>> {
        const getResult = await this.getWebhookRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const existing = getResult.value;

        if (input.endpointUrl && !isValidEndpointUrl(input.endpointUrl)) {
            return Result.fail(
                new WebhookValidationError(
                    "Endpoint URL must use HTTPS. HTTP is only allowed for localhost."
                )
            );
        }

        if (input.events !== undefined && input.events.length === 0) {
            return Result.fail(
                new WebhookValidationError("At least one event must be selected.")
            );
        }

        const updated: IWebhook = {
            ...existing,
            values: {
                ...existing.values,
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.slug !== undefined ? { slug: input.slug } : {}),
                ...(input.endpointUrl !== undefined ? { endpointUrl: input.endpointUrl } : {}),
                ...(input.description !== undefined ? { description: input.description } : {}),
                ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
                ...(input.events !== undefined ? { events: input.events } : {})
            }
        };

        return this.updateRepository.execute(updated);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookUseCaseImpl,
    dependencies: [GetWebhookRepository, UpdateWebhookRepository]
});
```

- [ ] **Step 15: Create `src/features/UpdateWebhook/UpdateWebhookRepository.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/domain/constants.js";
import type { IWebhook } from "~/domain/types.js";

class UpdateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface
    ) {}

    async execute(webhook: IWebhook): Promise<Result<IWebhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const updateResult = await this.updateEntryUseCase.execute(
                modelResult.value,
                webhook.id,
                { values: webhook.values }
            );

            if (updateResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(updateResult.error as any));
            }

            return Result.ok(webhook);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: UpdateWebhookRepositoryImpl,
    dependencies: [GetModelUseCase, UpdateEntryUseCase]
});
```

- [ ] **Step 16: Create `src/features/UpdateWebhook/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import UpdateWebhookUseCaseImpl from "./UpdateWebhookUseCase.js";
import UpdateWebhookRepositoryImpl from "./UpdateWebhookRepository.js";

export const UpdateWebhookFeature = createFeature({
    name: "UpdateWebhook",
    register(container) {
        container.register(UpdateWebhookUseCaseImpl);
        container.register(UpdateWebhookRepositoryImpl).inSingletonScope();
    }
});
```

---

### 8e: `DeleteWebhook`

Removes the webhook and all associated delivery log entries.

**Files:**
- Create: `packages/api-webhooks/src/features/DeleteWebhook/abstractions.ts`
- Create: `packages/api-webhooks/src/features/DeleteWebhook/DeleteWebhookUseCase.ts`
- Create: `packages/api-webhooks/src/features/DeleteWebhook/DeleteWebhookRepository.ts`
- Create: `packages/api-webhooks/src/features/DeleteWebhook/feature.ts`

- [ ] **Step 17: Create `src/features/DeleteWebhook/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type {
    WebhookNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError
} from "~/domain/errors.js";

type IError = WebhookNotFoundError | WebhookPersistenceError | WebhookModelNotFoundError;

export interface IDeleteWebhookUseCase {
    execute(id: string): Promise<Result<boolean, IError>>;
}

export const DeleteWebhookUseCase = createAbstraction<IDeleteWebhookUseCase>(
    "Webhooks/DeleteWebhookUseCase"
);
export namespace DeleteWebhookUseCase {
    export type Interface = IDeleteWebhookUseCase;
    export type Error = IError;
}

export interface IDeleteWebhookRepository {
    execute(id: string): Promise<Result<boolean, IError>>;
}

export const DeleteWebhookRepository = createAbstraction<IDeleteWebhookRepository>(
    "Webhooks/DeleteWebhookRepository"
);
export namespace DeleteWebhookRepository {
    export type Interface = IDeleteWebhookRepository;
}
```

- [ ] **Step 18: Create `src/features/DeleteWebhook/DeleteWebhookUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { DeleteWebhookUseCase as UseCaseAbstraction, DeleteWebhookRepository } from "./abstractions.js";
import { GetWebhookRepository } from "~/features/GetWebhook/abstractions.js";

class DeleteWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getWebhookRepository: GetWebhookRepository.Interface,
        private deleteRepository: DeleteWebhookRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        const getResult = await this.getWebhookRepository.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }
        return this.deleteRepository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: DeleteWebhookUseCaseImpl,
    dependencies: [GetWebhookRepository, DeleteWebhookRepository]
});
```

- [ ] **Step 19: Create `src/features/DeleteWebhook/DeleteWebhookRepository.ts`**

Deletes the webhook entry and all delivery log entries for this webhook in pages of 100.

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { DeleteEntryUseCase, ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { DeleteWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_MODEL_ID, WEBHOOK_DELIVERY_MODEL_ID } from "~/domain/constants.js";

class DeleteWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, RepositoryAbstraction.Error>> {
        try {
            const webhookModelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (webhookModelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const deliveryModelResult = await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (!deliveryModelResult.isFail()) {
                // Delete all delivery log entries in pages of 100
                let cursor: string | undefined = undefined;
                do {
                    const listResult = await this.listEntriesUseCase.execute(
                        deliveryModelResult.value,
                        {
                            where: { values: { webhookId: id } },
                            limit: 100,
                            after: cursor
                        }
                    );
                    if (listResult.isFail()) break;

                    for (const entry of listResult.value.items) {
                        await this.deleteEntryUseCase.execute(
                            deliveryModelResult.value,
                            entry.entryId
                        );
                    }

                    cursor = listResult.value.meta.cursor ?? undefined;
                } while (cursor);
            }

            const deleteResult = await this.deleteEntryUseCase.execute(
                webhookModelResult.value,
                id
            );

            if (deleteResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(deleteResult.error as any));
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: DeleteWebhookRepositoryImpl,
    dependencies: [GetModelUseCase, ListEntriesUseCase, DeleteEntryUseCase]
});
```

- [ ] **Step 20: Create `src/features/DeleteWebhook/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import DeleteWebhookUseCaseImpl from "./DeleteWebhookUseCase.js";
import DeleteWebhookRepositoryImpl from "./DeleteWebhookRepository.js";

export const DeleteWebhookFeature = createFeature({
    name: "DeleteWebhook",
    register(container) {
        container.register(DeleteWebhookUseCaseImpl);
        container.register(DeleteWebhookRepositoryImpl).inSingletonScope();
    }
});
```

- [ ] **Step 21: Build**

```bash
yarn build -p @webiny/api-webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 22: Commit**

```bash
git add packages/api-webhooks/src/features/CreateWebhook/ packages/api-webhooks/src/features/GetWebhook/ packages/api-webhooks/src/features/ListWebhooks/ packages/api-webhooks/src/features/UpdateWebhook/ packages/api-webhooks/src/features/DeleteWebhook/
git commit -m "feat(api-webhooks): add Webhook CRUD use cases"
```

---

## Task 9: Delivery log use cases

### 9a: `CreateWebhookDelivery`

Compresses `payload`, `requestHeaders`, and `responseBody` before storing in CMS longText fields.

**Files:**
- Create: `packages/api-webhooks/src/features/CreateWebhookDelivery/abstractions.ts`
- Create: `packages/api-webhooks/src/features/CreateWebhookDelivery/CreateWebhookDeliveryRepository.ts`
- Create: `packages/api-webhooks/src/features/CreateWebhookDelivery/feature.ts`

- [ ] **Step 1: Create `src/features/CreateWebhookDelivery/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { ICreateDeliveryInput, IWebhookDelivery } from "~/domain/types.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface ICreateWebhookDeliveryRepository {
    execute(input: ICreateDeliveryInput): Promise<Result<IWebhookDelivery, IError>>;
}

export const CreateWebhookDeliveryRepository = createAbstraction<ICreateWebhookDeliveryRepository>(
    "Webhooks/CreateWebhookDeliveryRepository"
);
export namespace CreateWebhookDeliveryRepository {
    export type Interface = ICreateWebhookDeliveryRepository;
    export type Error = IError;
}
```

- [ ] **Step 2: Create `src/features/CreateWebhookDelivery/CreateWebhookDeliveryRepository.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CreateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/domain/constants.js";
import type { ICreateDeliveryInput, IWebhookDelivery } from "~/domain/types.js";
import { randomBytes } from "node:crypto";

class CreateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(input: ICreateDeliveryInput): Promise<Result<IWebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const [compressedPayload, compressedHeaders, compressedBody] = await Promise.all([
                this.compressionHandler.compress(input.payload),
                this.compressionHandler.compress(input.requestHeaders),
                this.compressionHandler.compress(input.responseBody)
            ]);

            const id = randomBytes(8).toString("hex");

            const createResult = await this.createEntryUseCase.execute(modelResult.value, {
                id,
                values: {
                    webhookId: input.webhookId,
                    backgroundTaskId: input.backgroundTaskId,
                    eventType: input.eventType,
                    payload: JSON.stringify(compressedPayload),
                    requestHeaders: JSON.stringify(compressedHeaders),
                    responseTime: input.responseTime,
                    responseStatus: input.responseStatus,
                    responseBody: JSON.stringify(compressedBody),
                    expiresAt: input.expiresAt
                }
            });

            if (createResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            const delivery: IWebhookDelivery = {
                id,
                values: {
                    webhookId: input.webhookId,
                    backgroundTaskId: input.backgroundTaskId,
                    eventType: input.eventType,
                    payload: input.payload,
                    requestHeaders: input.requestHeaders,
                    responseTime: input.responseTime,
                    responseStatus: input.responseStatus,
                    responseBody: input.responseBody,
                    expiresAt: input.expiresAt
                }
            };

            return Result.ok(delivery);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookDeliveryRepositoryImpl,
    dependencies: [GetModelUseCase, CreateEntryUseCase, CompressionHandler]
});
```

- [ ] **Step 3: Create `src/features/CreateWebhookDelivery/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import CreateWebhookDeliveryRepositoryImpl from "./CreateWebhookDeliveryRepository.js";

export const CreateWebhookDeliveryFeature = createFeature({
    name: "CreateWebhookDelivery",
    register(container) {
        container.register(CreateWebhookDeliveryRepositoryImpl).inSingletonScope();
    }
});
```

---

### 9b: `GetWebhookDelivery`

Reads a delivery and decompresses `payload`, `requestHeaders`, `responseBody`.

**Files:**
- Create: `packages/api-webhooks/src/features/GetWebhookDelivery/abstractions.ts`
- Create: `packages/api-webhooks/src/features/GetWebhookDelivery/GetWebhookDeliveryUseCase.ts`
- Create: `packages/api-webhooks/src/features/GetWebhookDelivery/GetWebhookDeliveryRepository.ts`
- Create: `packages/api-webhooks/src/features/GetWebhookDelivery/feature.ts`

- [ ] **Step 4: Create `src/features/GetWebhookDelivery/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhookDelivery } from "~/domain/types.js";
import type {
    WebhookDeliveryNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError
} from "~/domain/errors.js";

type IError = WebhookDeliveryNotFoundError | WebhookPersistenceError | WebhookModelNotFoundError;

export interface IGetWebhookDeliveryUseCase {
    execute(id: string): Promise<Result<IWebhookDelivery, IError>>;
}

export const GetWebhookDeliveryUseCase = createAbstraction<IGetWebhookDeliveryUseCase>(
    "Webhooks/GetWebhookDeliveryUseCase"
);
export namespace GetWebhookDeliveryUseCase {
    export type Interface = IGetWebhookDeliveryUseCase;
    export type Error = IError;
}

export interface IGetWebhookDeliveryRepository {
    execute(id: string): Promise<Result<IWebhookDelivery, IError>>;
}

export const GetWebhookDeliveryRepository = createAbstraction<IGetWebhookDeliveryRepository>(
    "Webhooks/GetWebhookDeliveryRepository"
);
export namespace GetWebhookDeliveryRepository {
    export type Interface = IGetWebhookDeliveryRepository;
    export type Error = IError;
}
```

- [ ] **Step 5: Create `src/features/GetWebhookDelivery/GetWebhookDeliveryUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import {
    GetWebhookDeliveryUseCase as UseCaseAbstraction,
    GetWebhookDeliveryRepository
} from "./abstractions.js";

class GetWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetWebhookDeliveryRepository.Interface) {}

    async execute(id: string) {
        return this.repository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetWebhookDeliveryUseCaseImpl,
    dependencies: [GetWebhookDeliveryRepository]
});
```

- [ ] **Step 6: Create `src/features/GetWebhookDelivery/GetWebhookDeliveryRepository.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { GetWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookDeliveryNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/domain/constants.js";
import type { IWebhookDelivery } from "~/domain/types.js";

interface IRawDeliveryValues {
    webhookId: string;
    backgroundTaskId: string;
    eventType: string;
    payload: string;
    requestHeaders: string;
    responseTime: number;
    responseStatus: number;
    responseBody: string;
    expiresAt: string;
}

class GetWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(id: string): Promise<Result<IWebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const entryResult = await this.getLatestRevision.execute<IRawDeliveryValues>(
                modelResult.value,
                { id }
            );

            if (entryResult.isFail()) {
                return Result.fail(new WebhookDeliveryNotFoundError(id));
            }

            const entry = entryResult.value;
            const raw = entry.values;

            const [payload, requestHeaders, responseBody] = await Promise.all([
                this.safeDecompress<object>(raw.payload),
                this.safeDecompress<object>(raw.requestHeaders),
                this.safeDecompress<string>(raw.responseBody)
            ]);

            const delivery: IWebhookDelivery = {
                id: entry.entryId,
                values: {
                    webhookId: raw.webhookId,
                    backgroundTaskId: raw.backgroundTaskId,
                    eventType: raw.eventType,
                    payload,
                    requestHeaders,
                    responseTime: raw.responseTime,
                    responseStatus: raw.responseStatus,
                    responseBody,
                    expiresAt: raw.expiresAt
                },
                createdOn: entry.createdOn
            };

            return Result.ok(delivery);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }

    private async safeDecompress<T>(stored: string): Promise<T | null> {
        if (!stored) return null;
        try {
            return await this.compressionHandler.decompress<T>(JSON.parse(stored));
        } catch {
            return null;
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: GetWebhookDeliveryRepositoryImpl,
    dependencies: [GetModelUseCase, GetLatestRevisionByEntryIdUseCase, CompressionHandler]
});
```

- [ ] **Step 7: Create `src/features/GetWebhookDelivery/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import GetWebhookDeliveryUseCaseImpl from "./GetWebhookDeliveryUseCase.js";
import GetWebhookDeliveryRepositoryImpl from "./GetWebhookDeliveryRepository.js";

export const GetWebhookDeliveryFeature = createFeature({
    name: "GetWebhookDelivery",
    register(container) {
        container.register(GetWebhookDeliveryUseCaseImpl);
        container.register(GetWebhookDeliveryRepositoryImpl).inSingletonScope();
    }
});
```

---

### 9c: `ListWebhookDeliveries`

Lists deliveries for a specific webhook. Returns lightweight entries (metadata only, no decompression for performance).

**Files:**
- Create: `packages/api-webhooks/src/features/ListWebhookDeliveries/abstractions.ts`
- Create: `packages/api-webhooks/src/features/ListWebhookDeliveries/ListWebhookDeliveriesUseCase.ts`
- Create: `packages/api-webhooks/src/features/ListWebhookDeliveries/ListWebhookDeliveriesRepository.ts`
- Create: `packages/api-webhooks/src/features/ListWebhookDeliveries/feature.ts`

- [ ] **Step 8: Create `src/features/ListWebhookDeliveries/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhookDelivery, IListWebhookDeliveriesInput, IListMeta } from "~/domain/types.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface IListWebhookDeliveriesOutput {
    items: IWebhookDelivery[];
    meta: IListMeta;
}

export interface IListWebhookDeliveriesUseCase {
    execute(input: IListWebhookDeliveriesInput): Promise<Result<IListWebhookDeliveriesOutput, IError>>;
}

export const ListWebhookDeliveriesUseCase = createAbstraction<IListWebhookDeliveriesUseCase>(
    "Webhooks/ListWebhookDeliveriesUseCase"
);
export namespace ListWebhookDeliveriesUseCase {
    export type Interface = IListWebhookDeliveriesUseCase;
    export type Output = IListWebhookDeliveriesOutput;
    export type Error = IError;
}

export interface IListWebhookDeliveriesRepository {
    execute(input: IListWebhookDeliveriesInput): Promise<Result<IListWebhookDeliveriesOutput, IError>>;
}

export const ListWebhookDeliveriesRepository = createAbstraction<IListWebhookDeliveriesRepository>(
    "Webhooks/ListWebhookDeliveriesRepository"
);
export namespace ListWebhookDeliveriesRepository {
    export type Interface = IListWebhookDeliveriesRepository;
}
```

- [ ] **Step 9: Create `src/features/ListWebhookDeliveries/ListWebhookDeliveriesUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import {
    ListWebhookDeliveriesUseCase as UseCaseAbstraction,
    ListWebhookDeliveriesRepository
} from "./abstractions.js";

class ListWebhookDeliveriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListWebhookDeliveriesRepository.Interface) {}

    async execute(input: UseCaseAbstraction.Interface extends { execute(i: infer I): any } ? I : never) {
        return this.repository.execute(input as any);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesUseCaseImpl,
    dependencies: [ListWebhookDeliveriesRepository]
});
```

- [ ] **Step 10: Create `src/features/ListWebhookDeliveries/ListWebhookDeliveriesRepository.ts`**

Deliveries are listed without decompressing the large payload fields — the list view only shows metadata.

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListWebhookDeliveriesRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/domain/constants.js";
import type { IListWebhookDeliveriesInput } from "~/domain/types.js";

class ListWebhookDeliveriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface
    ) {}

    async execute(input: IListWebhookDeliveriesInput): Promise<Result<RepositoryAbstraction.Interface extends { execute(i: any): Promise<infer R> } ? R extends Result<infer V, any> ? V : never : never, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const listResult = await this.listEntriesUseCase.execute(
                modelResult.value,
                {
                    where: { values: { webhookId: input.webhookId } },
                    sort: ["createdOn_DESC"],
                    limit: input.limit ?? 100,
                    after: input.after
                }
            );

            if (listResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(listResult.error as any));
            }

            const { items, meta } = listResult.value;
            return Result.ok({
                items: items.map(entry => ({
                    id: entry.entryId,
                    values: {
                        webhookId: entry.values.webhookId as string,
                        backgroundTaskId: entry.values.backgroundTaskId as string,
                        eventType: entry.values.eventType as string,
                        payload: null,
                        requestHeaders: null,
                        responseTime: entry.values.responseTime as number,
                        responseStatus: entry.values.responseStatus as number,
                        responseBody: null,
                        expiresAt: entry.values.expiresAt as string
                    },
                    createdOn: entry.createdOn
                })),
                meta: {
                    cursor: meta.cursor ?? null,
                    hasMoreItems: meta.hasMoreItems,
                    totalCount: meta.totalCount
                }
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesRepositoryImpl,
    dependencies: [GetModelUseCase, ListEntriesUseCase]
});
```

- [ ] **Step 11: Create `src/features/ListWebhookDeliveries/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import ListWebhookDeliveriesUseCaseImpl from "./ListWebhookDeliveriesUseCase.js";
import ListWebhookDeliveriesRepositoryImpl from "./ListWebhookDeliveriesRepository.js";

export const ListWebhookDeliveriesFeature = createFeature({
    name: "ListWebhookDeliveries",
    register(container) {
        container.register(ListWebhookDeliveriesUseCaseImpl);
        container.register(ListWebhookDeliveriesRepositoryImpl).inSingletonScope();
    }
});
```

---

### 9d: `ResendWebhookDelivery`

Gets the original delivery, extracts the data from its payload, and dispatches a new `SendWebhookTask` with the same input.

**Files:**
- Create: `packages/api-webhooks/src/features/ResendWebhookDelivery/abstractions.ts`
- Create: `packages/api-webhooks/src/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts`
- Create: `packages/api-webhooks/src/features/ResendWebhookDelivery/feature.ts`

- [ ] **Step 12: Create `src/features/ResendWebhookDelivery/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhookDelivery } from "~/domain/types.js";
import type {
    WebhookDeliveryNotFoundError,
    WebhookNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError
} from "~/domain/errors.js";

type IError =
    | WebhookDeliveryNotFoundError
    | WebhookNotFoundError
    | WebhookPersistenceError
    | WebhookModelNotFoundError;

export interface IResendWebhookDeliveryUseCase {
    execute(deliveryId: string): Promise<Result<boolean, IError>>;
}

export const ResendWebhookDeliveryUseCase = createAbstraction<IResendWebhookDeliveryUseCase>(
    "Webhooks/ResendWebhookDeliveryUseCase"
);
export namespace ResendWebhookDeliveryUseCase {
    export type Interface = IResendWebhookDeliveryUseCase;
    export type Error = IError;
}
```

- [ ] **Step 13: Create `src/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { ResendWebhookDeliveryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookDeliveryRepository } from "~/features/GetWebhookDelivery/abstractions.js";
import { GetWebhookRepository } from "~/features/GetWebhook/abstractions.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { SEND_WEBHOOK_TASK } from "~/domain/constants.js";
import type { IWebhookPayload } from "~/domain/types.js";

class ResendWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getDeliveryRepository: GetWebhookDeliveryRepository.Interface,
        private getWebhookRepository: GetWebhookRepository.Interface,
        private taskService: TaskService.Interface
    ) {}

    async execute(deliveryId: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        const deliveryResult = await this.getDeliveryRepository.execute(deliveryId);
        if (deliveryResult.isFail()) {
            return Result.fail(deliveryResult.error);
        }

        const delivery = deliveryResult.value;

        // Verify webhook still exists
        const webhookResult = await this.getWebhookRepository.execute(
            delivery.values.webhookId
        );
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }

        // Extract the original data from the stored payload
        const originalPayload = delivery.values.payload as IWebhookPayload | null;
        const data = originalPayload?.data ?? {};

        await this.taskService.trigger({
            definition: SEND_WEBHOOK_TASK,
            name: `Resend webhook: ${delivery.values.eventType}`,
            input: {
                webhookId: delivery.values.webhookId,
                eventName: delivery.values.eventType,
                data
            }
        });

        return Result.ok(true);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryUseCaseImpl,
    dependencies: [GetWebhookDeliveryRepository, GetWebhookRepository, TaskService]
});
```

- [ ] **Step 14: Create `src/features/ResendWebhookDelivery/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import ResendWebhookDeliveryUseCaseImpl from "./ResendWebhookDeliveryUseCase.js";

export const ResendWebhookDeliveryFeature = createFeature({
    name: "ResendWebhookDelivery",
    register(container) {
        container.register(ResendWebhookDeliveryUseCaseImpl);
    }
});
```

---

## Task 10: Secret and Events use cases

### 10a: `GetWebhookSecret`

Retrieves the tenant's webhook signing secret. Auto-creates it with a fresh `whsec_<random>` if it doesn't exist yet (lazy initialization).

**Files:**
- Create: `packages/api-webhooks/src/features/GetWebhookSecret/abstractions.ts`
- Create: `packages/api-webhooks/src/features/GetWebhookSecret/GetWebhookSecretUseCase.ts`
- Create: `packages/api-webhooks/src/features/GetWebhookSecret/GetWebhookSecretRepository.ts`
- Create: `packages/api-webhooks/src/features/GetWebhookSecret/feature.ts`

- [ ] **Step 1: Create `src/features/GetWebhookSecret/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/domain/types.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface IGetWebhookSecretUseCase {
    execute(): Promise<Result<IWebhookSettings, IError>>;
}

export const GetWebhookSecretUseCase = createAbstraction<IGetWebhookSecretUseCase>(
    "Webhooks/GetWebhookSecretUseCase"
);
export namespace GetWebhookSecretUseCase {
    export type Interface = IGetWebhookSecretUseCase;
    export type Error = IError;
}

export interface IGetWebhookSecretRepository {
    execute(): Promise<Result<IWebhookSettings, IError>>;
}

export const GetWebhookSecretRepository = createAbstraction<IGetWebhookSecretRepository>(
    "Webhooks/GetWebhookSecretRepository"
);
export namespace GetWebhookSecretRepository {
    export type Interface = IGetWebhookSecretRepository;
    export type Error = IError;
}
```

- [ ] **Step 2: Create `src/features/GetWebhookSecret/GetWebhookSecretUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import {
    GetWebhookSecretUseCase as UseCaseAbstraction,
    GetWebhookSecretRepository
} from "./abstractions.js";

class GetWebhookSecretUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetWebhookSecretRepository.Interface) {}

    async execute() {
        return this.repository.execute();
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetWebhookSecretUseCaseImpl,
    dependencies: [GetWebhookSecretRepository]
});
```

- [ ] **Step 3: Create `src/features/GetWebhookSecret/GetWebhookSecretRepository.ts`**

Uses `GetSingletonEntryUseCase` which creates the entry if it doesn't exist. If first access, auto-generates a `whsec_<random>` secret via `UpdateSingletonEntryUseCase`.

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import {
    GetSingletonEntryUseCase,
    UpdateSingletonEntryUseCase
} from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetWebhookSecretRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/domain/constants.js";
import type { IWebhookSettings, IWebhookSettingsValues } from "~/domain/types.js";
import { randomBytes } from "node:crypto";

const generateSecret = (): string => {
    return `whsec_${randomBytes(32).toString("base64url")}`;
};

class GetWebhookSecretRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getSingletonEntry: GetSingletonEntryUseCase.Interface,
        private updateSingletonEntry: UpdateSingletonEntryUseCase.Interface
    ) {}

    async execute(): Promise<Result<IWebhookSettings, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_SETTINGS_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_SETTINGS_MODEL_ID));
            }

            const model = modelResult.value;
            const entryResult = await this.getSingletonEntry.execute<IWebhookSettingsValues>(model);

            if (entryResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(entryResult.error as any));
            }

            const entry = entryResult.value;

            // Auto-initialize secret if not set yet
            if (!entry.values.secret) {
                const secret = generateSecret();
                const updateResult = await this.updateSingletonEntry.execute<IWebhookSettingsValues>(
                    model,
                    { values: { secret } }
                );
                if (updateResult.isFail()) {
                    return Result.fail(new WebhookPersistenceError(updateResult.error as any));
                }
                return Result.ok({
                    id: entry.entryId,
                    values: { secret }
                });
            }

            return Result.ok({
                id: entry.entryId,
                values: { secret: entry.values.secret }
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: GetWebhookSecretRepositoryImpl,
    dependencies: [GetModelUseCase, GetSingletonEntryUseCase, UpdateSingletonEntryUseCase]
});
```

- [ ] **Step 4: Create `src/features/GetWebhookSecret/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import GetWebhookSecretUseCaseImpl from "./GetWebhookSecretUseCase.js";
import GetWebhookSecretRepositoryImpl from "./GetWebhookSecretRepository.js";

export const GetWebhookSecretFeature = createFeature({
    name: "GetWebhookSecret",
    register(container) {
        container.register(GetWebhookSecretUseCaseImpl);
        container.register(GetWebhookSecretRepositoryImpl).inSingletonScope();
    }
});
```

---

### 10b: `RotateWebhookSecret`

Generates a new `whsec_<random>` secret and replaces the current one. Old secret is immediately invalidated.

**Files:**
- Create: `packages/api-webhooks/src/features/RotateWebhookSecret/abstractions.ts`
- Create: `packages/api-webhooks/src/features/RotateWebhookSecret/RotateWebhookSecretUseCase.ts`
- Create: `packages/api-webhooks/src/features/RotateWebhookSecret/RotateWebhookSecretRepository.ts`
- Create: `packages/api-webhooks/src/features/RotateWebhookSecret/feature.ts`

- [ ] **Step 5: Create `src/features/RotateWebhookSecret/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/domain/types.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface IRotateWebhookSecretUseCase {
    execute(): Promise<Result<IWebhookSettings, IError>>;
}

export const RotateWebhookSecretUseCase = createAbstraction<IRotateWebhookSecretUseCase>(
    "Webhooks/RotateWebhookSecretUseCase"
);
export namespace RotateWebhookSecretUseCase {
    export type Interface = IRotateWebhookSecretUseCase;
    export type Error = IError;
}

export interface IRotateWebhookSecretRepository {
    execute(): Promise<Result<IWebhookSettings, IError>>;
}

export const RotateWebhookSecretRepository = createAbstraction<IRotateWebhookSecretRepository>(
    "Webhooks/RotateWebhookSecretRepository"
);
export namespace RotateWebhookSecretRepository {
    export type Interface = IRotateWebhookSecretRepository;
}
```

- [ ] **Step 6: Create `src/features/RotateWebhookSecret/RotateWebhookSecretUseCase.ts`**

```ts
import { Result } from "@webiny/feature/api";
import {
    RotateWebhookSecretUseCase as UseCaseAbstraction,
    RotateWebhookSecretRepository
} from "./abstractions.js";

class RotateWebhookSecretUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: RotateWebhookSecretRepository.Interface) {}

    async execute() {
        return this.repository.execute();
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: RotateWebhookSecretUseCaseImpl,
    dependencies: [RotateWebhookSecretRepository]
});
```

- [ ] **Step 7: Create `src/features/RotateWebhookSecret/RotateWebhookSecretRepository.ts`**

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { UpdateSingletonEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { RotateWebhookSecretRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/domain/errors.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/domain/constants.js";
import type { IWebhookSettings, IWebhookSettingsValues } from "~/domain/types.js";
import { randomBytes } from "node:crypto";

class RotateWebhookSecretRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private updateSingletonEntry: UpdateSingletonEntryUseCase.Interface
    ) {}

    async execute(): Promise<Result<IWebhookSettings, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_SETTINGS_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_SETTINGS_MODEL_ID));
            }

            const newSecret = `whsec_${randomBytes(32).toString("base64url")}`;

            const updateResult = await this.updateSingletonEntry.execute<IWebhookSettingsValues>(
                modelResult.value,
                { values: { secret: newSecret } }
            );

            if (updateResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(updateResult.error as any));
            }

            return Result.ok({
                id: updateResult.value.entryId,
                values: { secret: newSecret }
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: RotateWebhookSecretRepositoryImpl,
    dependencies: [GetModelUseCase, UpdateSingletonEntryUseCase]
});
```

- [ ] **Step 8: Create `src/features/RotateWebhookSecret/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import RotateWebhookSecretUseCaseImpl from "./RotateWebhookSecretUseCase.js";
import RotateWebhookSecretRepositoryImpl from "./RotateWebhookSecretRepository.js";

export const RotateWebhookSecretFeature = createFeature({
    name: "RotateWebhookSecret",
    register(container) {
        container.register(RotateWebhookSecretUseCaseImpl);
        container.register(RotateWebhookSecretRepositoryImpl).inSingletonScope();
    }
});
```

---

### 10c: `ListAvailableWebhookEvents`

Collects all registered `WebhookEventProvider` implementations and merges their event lists.

**Files:**
- Create: `packages/api-webhooks/src/features/ListAvailableWebhookEvents/abstractions.ts`
- Create: `packages/api-webhooks/src/features/ListAvailableWebhookEvents/ListAvailableWebhookEventsUseCase.ts`
- Create: `packages/api-webhooks/src/features/ListAvailableWebhookEvents/feature.ts`

- [ ] **Step 9: Create `src/features/ListAvailableWebhookEvents/abstractions.ts`**

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { IWebhookEventDefinition } from "~/domain/types.js";

export interface IListAvailableWebhookEventsUseCase {
    execute(): Promise<Result<IWebhookEventDefinition[], Error>>;
}

export const ListAvailableWebhookEventsUseCase =
    createAbstraction<IListAvailableWebhookEventsUseCase>(
        "Webhooks/ListAvailableWebhookEventsUseCase"
    );

export namespace ListAvailableWebhookEventsUseCase {
    export type Interface = IListAvailableWebhookEventsUseCase;
}
```

- [ ] **Step 10: Create `src/features/ListAvailableWebhookEvents/ListAvailableWebhookEventsUseCase.ts`**

Resolves ALL `WebhookEventProvider` implementations registered in the container and merges their event lists.

```ts
import { Result } from "@webiny/feature/api";
import { Container } from "@webiny/di";
import { ListAvailableWebhookEventsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WebhookEventProvider } from "~/abstractions/WebhookEventProvider.js";
import type { IWebhookEventDefinition } from "~/domain/types.js";

class ListAvailableWebhookEventsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private container: Container) {}

    async execute(): Promise<Result<IWebhookEventDefinition[], Error>> {
        try {
            const providers = this.container.resolveAll<WebhookEventProvider.Interface>(
                WebhookEventProvider.token
            );

            const allEvents: IWebhookEventDefinition[] = [];

            for (const provider of providers) {
                const events = await provider.getAvailableEvents();
                allEvents.push(...events);
            }

            return Result.ok(allEvents);
        } catch (error) {
            return Result.fail(error as Error);
        }
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ListAvailableWebhookEventsUseCaseImpl,
    dependencies: [Container]
});
```

- [ ] **Step 11: Create `src/features/ListAvailableWebhookEvents/feature.ts`**

```ts
import { createFeature } from "@webiny/feature/api";
import ListAvailableWebhookEventsUseCaseImpl from "./ListAvailableWebhookEventsUseCase.js";

export const ListAvailableWebhookEventsFeature = createFeature({
    name: "ListAvailableWebhookEvents",
    register(container) {
        container.register(ListAvailableWebhookEventsUseCaseImpl);
    }
});
```

- [ ] **Step 12: Build**

```bash
yarn build -p @webiny/api-webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 13: Commit all delivery + secret + events use cases**

```bash
git add packages/api-webhooks/src/features/CreateWebhookDelivery/ packages/api-webhooks/src/features/GetWebhookDelivery/ packages/api-webhooks/src/features/ListWebhookDeliveries/ packages/api-webhooks/src/features/ResendWebhookDelivery/ packages/api-webhooks/src/features/GetWebhookSecret/ packages/api-webhooks/src/features/RotateWebhookSecret/ packages/api-webhooks/src/features/ListAvailableWebhookEvents/
git commit -m "feat(api-webhooks): add delivery log and secret management use cases"
```

---

**Continue in Part 4:** `docs/superpowers/plans/2026-05-11-webhooks-phase1-part4.md`
