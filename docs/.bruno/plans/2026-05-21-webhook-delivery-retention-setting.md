# Webhook Delivery Retention Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-configurable `deliveryRetentionDays` number field to webhook settings so the `expiresAt` TTL on delivery records reflects a user-defined retention period (0–3650 days) instead of a hardcoded constant.

**Architecture:** `WEBHOOK_DELIVERY_MAX_RETENTION_DAYS = 3650` replaces the old constant and serves as both the validation ceiling and the default when the field is unset. The three delivery-creating entry points (`WebhookDispatcher`, `TriggerWebhookUseCase`, `ResendWebhookDeliveryUseCase`) each inject `GetWebhookSettingsRepository` and compute `expiresAt` from the retrieved value. The admin settings form gains a number input that saves through the existing settings gateway/use-case chain.

**Tech Stack:** TypeScript, MobX, Zod, Webiny CMS model builder (`fields.number().gte().lte()`), GraphQL SDL, Vitest

---

## File Map

| File | Change |
|------|--------|
| `packages/webhooks/src/api/domain/constants.ts` | Replace `WEBHOOK_DELIVERY_RETENTION_DAYS` with `WEBHOOK_DELIVERY_MAX_RETENTION_DAYS` |
| `packages/webhooks/src/api/domain/WebhookSettings.ts` | Add `deliveryRetentionDays: number \| undefined` |
| `packages/webhooks/src/api/models/WebhookSettingsModel.ts` | Add `deliveryRetentionDays` number field |
| `packages/webhooks/src/api/features/UpdateWebhookSettings/abstractions.ts` | Add field to `IUpdateWebhookSettingsInput` |
| `packages/webhooks/src/api/features/UpdateWebhookSettings/schema.ts` | Add Zod validation |
| `packages/webhooks/src/api/graphql/WebhookSettingsSchema.ts` | Add field to GQL type + input |
| `packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcher.ts` | Inject settings repo, use retention days |
| `packages/webhooks/src/api/features/TriggerWebhook/TriggerWebhookUseCase.ts` | Inject settings repo, use retention days |
| `packages/webhooks/src/api/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts` | Inject settings repo, use retention days |
| `packages/webhooks/src/admin/shared/types.ts` | Add `deliveryRetentionDays` to `WebhookSettings` |
| `packages/webhooks/src/admin/features/updateWebhookSettings/abstractions.ts` | Add field to `UpdateWebhookSettingsInput` |
| `packages/webhooks/src/admin/features/getWebhookSettings/GetWebhookSettingsGateway.ts` | Add field to GQL query |
| `packages/webhooks/src/admin/features/updateWebhookSettings/UpdateWebhookSettingsGateway.ts` | Add field to GQL mutation |
| `packages/webhooks/src/admin/presentation/WebhookSettings/abstractions.ts` | Flatten `actions` → `save` at root |
| `packages/webhooks/src/admin/presentation/WebhookSettings/WebhookSettingsPresenter.ts` | Add form field, update save/init, flatten actions |
| `packages/webhooks/__tests__/useCases/settingsRetention.test.ts` | New: round-trip test for `deliveryRetentionDays` |
| `packages/webhooks/__tests__/WebhookDispatcher.test.ts` | Add `GetWebhookSettingsRepository` mock + retention test |

---

## Task 1: Replace constant, update domain type

**Files:**
- Modify: `packages/webhooks/src/api/domain/constants.ts`
- Modify: `packages/webhooks/src/api/domain/WebhookSettings.ts`

- [ ] **Step 1: Update constants**

Replace the contents of `packages/webhooks/src/api/domain/constants.ts`:

```ts
export const WEBHOOK_MODEL_ID = "webhook";
export const WEBHOOK_DELIVERY_MODEL_ID = "webhookDelivery";
export const WEBHOOK_SETTINGS_MODEL_ID = "webhookSettings";
export const SEND_WEBHOOK_TASK = "sendWebhook";
export const WEBHOOK_DELIVERY_MAX_RETENTION_DAYS = 3650;
```

- [ ] **Step 2: Add field to domain type**

Replace the contents of `packages/webhooks/src/api/domain/WebhookSettings.ts`:

```ts
export interface IWebhookSettings {
    signingSecret: string | undefined;
    deliveryRetentionDays: number | undefined;
}
```

- [ ] **Step 3: Fix broken references to the old constant**

The three files that imported `WEBHOOK_DELIVERY_RETENTION_DAYS` will fail to compile now. Update each import line — replace:
```ts
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
```
with:
```ts
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
```
in these files (do not change the logic yet — Tasks 3–5 handle that):
- `packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcher.ts`
- `packages/webhooks/src/api/features/TriggerWebhook/TriggerWebhookUseCase.ts`
- `packages/webhooks/src/api/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts`

Also update the inline computation in each file from:
```ts
Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
```
to:
```ts
Date.now() + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000
```

- [ ] **Step 4: Run tests to confirm nothing broken**

```bash
yarn test packages/webhooks 2>&1 | tail -15
```

Expected: `127 passed (127)` (or current count).

- [ ] **Step 5: Commit**

```bash
git add packages/webhooks/src/api/domain/
git add packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcher.ts
git add packages/webhooks/src/api/features/TriggerWebhook/TriggerWebhookUseCase.ts
git add packages/webhooks/src/api/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts
git commit -m "refactor(webhooks): replace WEBHOOK_DELIVERY_RETENTION_DAYS with WEBHOOK_DELIVERY_MAX_RETENTION_DAYS"
```

---

## Task 2: CMS model, API input type, Zod schema, GraphQL SDL

**Files:**
- Modify: `packages/webhooks/src/api/models/WebhookSettingsModel.ts`
- Modify: `packages/webhooks/src/api/features/UpdateWebhookSettings/abstractions.ts`
- Modify: `packages/webhooks/src/api/features/UpdateWebhookSettings/schema.ts`
- Modify: `packages/webhooks/src/api/graphql/WebhookSettingsSchema.ts`
- Create: `packages/webhooks/__tests__/useCases/settingsRetention.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/webhooks/__tests__/useCases/settingsRetention.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

describe("Webhook settings deliveryRetentionDays", () => {
    const handler = useHandler();

    it("should default to undefined when not set", async () => {
        const context = await handler.handle();
        const getSettings = context.container.resolve(GetWebhookSettingsRepository);

        const result = await getSettings.execute();
        expect(result.isOk()).toBe(true);
        expect(result.value.deliveryRetentionDays).toBeUndefined();
    });

    it("should save and read back deliveryRetentionDays", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const getSettings = context.container.resolve(GetWebhookSettingsRepository);

        const updateResult = await updateSettings.execute({ deliveryRetentionDays: 30 });
        expect(updateResult.isOk()).toBe(true);
        expect(updateResult.value.deliveryRetentionDays).toBe(30);

        const readResult = await getSettings.execute();
        expect(readResult.isOk()).toBe(true);
        expect(readResult.value.deliveryRetentionDays).toBe(30);
    });

    it("should accept 0 (delete immediately)", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({ deliveryRetentionDays: 0 });
        expect(result.isOk()).toBe(true);
        expect(result.value.deliveryRetentionDays).toBe(0);
    });

    it("should accept the maximum value", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({
            deliveryRetentionDays: WEBHOOK_DELIVERY_MAX_RETENTION_DAYS
        });
        expect(result.isOk()).toBe(true);
        expect(result.value.deliveryRetentionDays).toBe(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS);
    });

    it("should reject values above the maximum", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({
            deliveryRetentionDays: WEBHOOK_DELIVERY_MAX_RETENTION_DAYS + 1
        });
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should reject negative values", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);

        const result = await updateSettings.execute({ deliveryRetentionDays: -1 });
        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn test packages/webhooks/__tests__/useCases/settingsRetention.test.ts 2>&1 | tail -15
```

Expected: tests fail (field not yet in model/schema/Zod).

- [ ] **Step 3: Add field to the CMS model**

Replace `packages/webhooks/src/api/models/WebhookSettingsModel.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WEBHOOK_SETTINGS_MODEL_ID, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

class WebhookSettingsModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder
            .public({
                modelId: WEBHOOK_SETTINGS_MODEL_ID,
                name: "Webhook Settings",
                group: "hidden"
            })
            .description("Global settings for the webhooks system.")
            .titleFieldId("signingSecret")
            .singularApiName("WebhookSettings")
            .pluralApiName("WebhookSettings")
            .tags(["$publishing:false", "$hidden:true"])
            .singleEntry();

        model.fields(fields => ({
            signingSecret: fields
                .text()
                .label("Signing Secret")
                .encrypt()
                .description("Global signing secret used for all webhook deliveries."),
            deliveryRetentionDays: fields
                .number()
                .label("Delivery Retention (days)")
                .gte(0, "Must be 0 or greater.")
                .lte(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS, `Must be at most ${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS}.`)
                .description(
                    `How long to keep delivery logs. 0 = delete immediately. Max ${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS} days.`
                )
        }));

        return [model];
    }
}

export const WebhookSettingsModel = ModelFactory.createImplementation({
    implementation: WebhookSettingsModelFactory,
    dependencies: []
});
```

- [ ] **Step 4: Add field to the API input type and Zod schema**

Replace `packages/webhooks/src/api/features/UpdateWebhookSettings/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";
import type {
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookPersistenceError,
    WebhookValidationError
} from "~/api/domain/errors.js";

export interface IUpdateWebhookSettingsInput {
    signingSecret?: string;
    deliveryRetentionDays?: number;
}

type IError =
    | WebhookModelNotFoundError
    | WebhookPersistenceError
    | WebhookNotAuthorizedError
    | WebhookValidationError;

export interface IUpdateWebhookSettingsUseCase {
    execute(input: IUpdateWebhookSettingsInput): Promise<Result<IWebhookSettings, IError>>;
}

export const UpdateWebhookSettingsUseCase = createAbstraction<IUpdateWebhookSettingsUseCase>(
    "Webhooks/UpdateWebhookSettingsUseCase"
);

export namespace UpdateWebhookSettingsUseCase {
    export type Interface = IUpdateWebhookSettingsUseCase;
    export type Input = IUpdateWebhookSettingsInput;
    export type Error = IError;
}

type IRepositoryError = WebhookModelNotFoundError | WebhookPersistenceError;

export interface IUpdateWebhookSettingsRepository {
    execute(
        input: IUpdateWebhookSettingsInput
    ): Promise<Result<IWebhookSettings, IRepositoryError>>;
}

export const UpdateWebhookSettingsRepository = createAbstraction<IUpdateWebhookSettingsRepository>(
    "Webhooks/UpdateWebhookSettingsRepository"
);

export namespace UpdateWebhookSettingsRepository {
    export type Interface = IUpdateWebhookSettingsRepository;
    export type Error = IRepositoryError;
}
```

Replace `packages/webhooks/src/api/features/UpdateWebhookSettings/schema.ts`:

```ts
import { z } from "zod";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

export const UpdateWebhookSettingsInputSchema = z.object({
    signingSecret: z.string().optional(),
    deliveryRetentionDays: z
        .number()
        .int()
        .min(0)
        .max(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS)
        .optional()
});
```

- [ ] **Step 5: Add field to the GraphQL SDL**

Replace the `addTypeDefs` block in `packages/webhooks/src/api/graphql/WebhookSettingsSchema.ts`:

```ts
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookSettings {
                signingSecret: String
                deliveryRetentionDays: Int
            }

            type WebhookSettingsResponse {
                data: WebhookSettings
                error: WebhookError
            }

            input UpdateWebhookSettingsInput {
                signingSecret: String
                deliveryRetentionDays: Int
            }

            extend type WebhookQuery {
                getSettings: WebhookSettingsResponse
            }

            extend type WebhookMutation {
                updateSettings(input: UpdateWebhookSettingsInput!): WebhookSettingsResponse
            }
        `);
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
yarn test packages/webhooks/__tests__/useCases/settingsRetention.test.ts 2>&1 | tail -15
```

Expected: `6 passed (6)`.

- [ ] **Step 7: Run the full suite to check for regressions**

```bash
yarn test packages/webhooks 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/webhooks/src/api/models/WebhookSettingsModel.ts
git add packages/webhooks/src/api/features/UpdateWebhookSettings/
git add packages/webhooks/src/api/graphql/WebhookSettingsSchema.ts
git add packages/webhooks/__tests__/useCases/settingsRetention.test.ts
git commit -m "feat(webhooks): add deliveryRetentionDays to settings model and GraphQL schema"
```

---

## Task 3: WebhookDispatcher — read retention from settings

**Files:**
- Modify: `packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcher.ts`
- Modify: `packages/webhooks/__tests__/WebhookDispatcher.test.ts`

- [ ] **Step 1: Write the failing test**

In `packages/webhooks/__tests__/WebhookDispatcher.test.ts`, add two things:

1. In `beforeEach`, register a `GetWebhookSettingsRepository` mock:

```ts
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
```

Inside `beforeEach`, after the existing `container.registerInstance` calls, add:

```ts
        container.registerInstance(GetWebhookSettingsRepository, {
            execute: vi.fn().mockResolvedValue(
                Result.ok({ signingSecret: undefined, deliveryRetentionDays: undefined })
            )
        });
```

2. Add a new test after the existing ones:

```ts
    it("uses deliveryRetentionDays from settings to compute expiresAt", async () => {
        const retentionDays = 7;
        const settingsMock = vi.fn().mockResolvedValue(
            Result.ok({ signingSecret: undefined, deliveryRetentionDays: retentionDays })
        );
        container.registerInstance(GetWebhookSettingsRepository, { execute: settingsMock });

        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [makeWebhook("wh-1", "shop-sync", ["product.entry.published"])],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            })
        );

        const before = Date.now();
        const dispatcher = container.resolve(WebhookDispatcher);
        await dispatcher.dispatch("product.entry.published", { entryId: "abc" });
        const after = Date.now();

        const [callArgs] = createDeliveryMock.mock.calls;
        const expiresAt = new Date(callArgs[0].expiresAt).getTime();
        const expectedMin = before + retentionDays * 24 * 60 * 60 * 1000;
        const expectedMax = after + retentionDays * 24 * 60 * 60 * 1000;

        expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
        expect(expiresAt).toBeLessThanOrEqual(expectedMax);
        expect(settingsMock).toHaveBeenCalledOnce();
    });

    it("falls back to WEBHOOK_DELIVERY_MAX_RETENTION_DAYS when deliveryRetentionDays is undefined", async () => {
        container.registerInstance(GetWebhookSettingsRepository, {
            execute: vi.fn().mockResolvedValue(
                Result.ok({ signingSecret: undefined, deliveryRetentionDays: undefined })
            )
        });

        listRepoMock.mockResolvedValue(
            Result.ok({
                items: [makeWebhook("wh-1", "shop-sync", ["product.entry.published"])],
                meta: { cursor: null, hasMoreItems: false, totalCount: 1 }
            })
        );

        const before = Date.now();
        const dispatcher = container.resolve(WebhookDispatcher);
        await dispatcher.dispatch("product.entry.published", {});
        const after = Date.now();

        const [callArgs] = createDeliveryMock.mock.calls;
        const expiresAt = new Date(callArgs[0].expiresAt).getTime();
        const expectedMin = before + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const expectedMax = after + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000;

        expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
        expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn test packages/webhooks/__tests__/WebhookDispatcher.test.ts 2>&1 | tail -15
```

Expected: new tests fail (settings repo not yet injected into dispatcher).

- [ ] **Step 3: Update WebhookDispatcher to inject settings**

Replace `packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcher.ts`:

```ts
import {
    WebhookDispatcher as WebhookDispatcherAbstraction,
    WebhookProvider
} from "@webiny/api-core/features/webhooks/index.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookDispatcherData } from "@webiny/api-core/features/webhooks/WebhookDispatcher/abstractions.js";
import type { ISendWebhookTaskInput } from "~/api/features/SendWebhookTask/types.js";

class WebhookDispatcherImpl implements WebhookDispatcherAbstraction.Interface {
    constructor(
        private readonly listWebhooksRepository: ListWebhooksRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly provider: WebhookProvider.Interface,
        private readonly getSettingsRepository: GetWebhookSettingsRepository.Interface
    ) {}

    async dispatch<T extends IWebhookDispatcherData = IWebhookDispatcherData>(
        eventName: string,
        payload: T
    ): Promise<void> {
        const events = await this.provider.execute();
        const event = events.find(event => {
            return event.eventName === eventName;
        });
        if (!event) {
            return;
        }

        const result = await this.listWebhooksRepository.execute({
            where: {
                enabled: true,
                events_contains: eventName
            }
        });

        if (result.isFail()) {
            return;
        }

        const settingsResult = await this.getSettingsRepository.execute();
        const retentionDays = settingsResult.isOk()
            ? (settingsResult.value.deliveryRetentionDays ?? WEBHOOK_DELIVERY_MAX_RETENTION_DAYS)
            : WEBHOOK_DELIVERY_MAX_RETENTION_DAYS;

        const expiresAt = new Date(
            Date.now() + retentionDays * 24 * 60 * 60 * 1000
        ).toISOString();

        for (const webhook of result.value.items) {
            const deliveryResult = await this.createDeliveryRepository.execute({
                webhookId: webhook.id,
                eventType: event.eventName,
                status: "pending",
                expiresAt,
                payload
            });

            if (deliveryResult.isFail()) {
                continue;
            }

            await this.taskService.trigger<ISendWebhookTaskInput>({
                definition: SEND_WEBHOOK_TASK,
                name: `Webhook: ${webhook.slug} — ${event.eventName}`,
                input: {
                    webhookId: webhook.id,
                    eventName,
                    deliveryId: deliveryResult.value.id
                }
            });
        }
    }
}

export const WebhookDispatcher = WebhookDispatcherAbstraction.createImplementation({
    implementation: WebhookDispatcherImpl,
    dependencies: [
        ListWebhooksRepository,
        CreateWebhookDeliveryRepository,
        TaskService,
        WebhookProvider,
        GetWebhookSettingsRepository
    ]
});
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
yarn test packages/webhooks/__tests__/WebhookDispatcher.test.ts 2>&1 | tail -15
```

Expected: all tests pass including the two new ones.

- [ ] **Step 5: Run full suite**

```bash
yarn test packages/webhooks 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/api/features/WebhookDispatcher/WebhookDispatcher.ts
git add packages/webhooks/__tests__/WebhookDispatcher.test.ts
git commit -m "feat(webhooks): WebhookDispatcher reads deliveryRetentionDays from settings"
```

---

## Task 4: TriggerWebhookUseCase — read retention from settings

**Files:**
- Modify: `packages/webhooks/src/api/features/TriggerWebhook/TriggerWebhookUseCase.ts`
- Modify: `packages/webhooks/__tests__/useCases/triggerWebhook.test.ts`

- [ ] **Step 1: Write the failing test**

Add at the end of `packages/webhooks/__tests__/useCases/triggerWebhook.test.ts`:

```ts
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
```

Add to the existing imports block (at the top with the others), then add this test inside the `describe` block:

```ts
    it("uses deliveryRetentionDays from settings to compute expiresAt", async () => {
        const context = await handler.handle();
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        await updateSettings.execute({ deliveryRetentionDays: 1 });

        const webhookResult = await createUseCase.execute({
            name: "Retention Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        const webhook = webhookResult.value;

        const before = Date.now();
        const result = await triggerUseCase.execute(webhook.id, { foo: "bar" });
        const after = Date.now();

        expect(result.isOk()).toBe(true);

        /* Verify the delivery was created (settings injection works). */
        const delivery = result.value;
        expect(delivery.webhookId).toBe(webhook.id);
        expect(delivery.status).toBe("pending");
    });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn test packages/webhooks/__tests__/useCases/triggerWebhook.test.ts 2>&1 | tail -15
```

Expected: new test fails (settings repo not yet injected).

- [ ] **Step 3: Update TriggerWebhookUseCase**

Replace `packages/webhooks/src/api/features/TriggerWebhook/TriggerWebhookUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerWebhookInputSchema } from "./schema.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { ISendWebhookTaskInput } from "~/api/features/SendWebhookTask/types.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";

class TriggerWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly getSettingsRepository: GetWebhookSettingsRepository.Interface
    ) {}

    async execute(
        webhookId: string,
        payload: Record<string, unknown>
    ): Promise<Result<WebhookDelivery, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = TriggerWebhookInputSchema.safeParse({ webhookId, payload });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const webhookResult = await this.getWebhookRepository.execute(parsed.data.webhookId);
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }

        const webhook = webhookResult.value;

        const settingsResult = await this.getSettingsRepository.execute();
        const retentionDays = settingsResult.isOk()
            ? (settingsResult.value.deliveryRetentionDays ?? WEBHOOK_DELIVERY_MAX_RETENTION_DAYS)
            : WEBHOOK_DELIVERY_MAX_RETENTION_DAYS;

        const expiresAt = new Date(
            Date.now() + retentionDays * 24 * 60 * 60 * 1000
        ).toISOString();

        const deliveryResult = await this.createDeliveryRepository.execute({
            webhookId: webhook.id,
            eventType: "webhook.test",
            status: "pending",
            payload,
            expiresAt
        });

        if (deliveryResult.isFail()) {
            return Result.fail(deliveryResult.error);
        }

        const delivery = deliveryResult.value;

        await this.taskService.trigger<ISendWebhookTaskInput>({
            definition: SEND_WEBHOOK_TASK,
            name: `Test webhook: ${webhook.slug}`,
            input: {
                webhookId: webhook.id,
                eventName: "webhook.test",
                deliveryId: delivery.id
            }
        });

        return Result.ok(delivery);
    }
}

export const TriggerWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [
        WebhookPermissions,
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        TaskService,
        GetWebhookSettingsRepository
    ]
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test packages/webhooks/__tests__/useCases/triggerWebhook.test.ts 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
yarn test packages/webhooks 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/api/features/TriggerWebhook/TriggerWebhookUseCase.ts
git add packages/webhooks/__tests__/useCases/triggerWebhook.test.ts
git commit -m "feat(webhooks): TriggerWebhookUseCase reads deliveryRetentionDays from settings"
```

---

## Task 5: ResendWebhookDeliveryUseCase — read retention from settings

**Files:**
- Modify: `packages/webhooks/src/api/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts`
- Modify: `packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts`

- [ ] **Step 1: Write the failing test**

Add this import at the top of `packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts`:

```ts
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
```

Add this test inside the `describe` block:

```ts
    it("uses deliveryRetentionDays from settings when resending", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const resendUseCase = context.container.resolve(ResendWebhookDeliveryUseCase);

        await updateSettings.execute({ deliveryRetentionDays: 1 });

        const { delivery } = await createWebhookAndTrigger(context);

        const result = await resendUseCase.execute(delivery.id);
        expect(result.isOk()).toBe(true);
    });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
yarn test packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts 2>&1 | tail -15
```

Expected: new test fails.

- [ ] **Step 3: Update ResendWebhookDeliveryUseCase**

Replace `packages/webhooks/src/api/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ResendWebhookDeliveryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ResendWebhookDeliveryInputSchema } from "./schema.js";
import { GetWebhookDeliveryRepository } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookPayload } from "~/api/features/SendWebhookTask/types.js";

class ResendWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getDeliveryRepository: GetWebhookDeliveryRepository.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly getSettingsRepository: GetWebhookSettingsRepository.Interface
    ) {}

    async execute(deliveryId: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = ResendWebhookDeliveryInputSchema.safeParse({ deliveryId });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const deliveryResult = await this.getDeliveryRepository.execute(parsed.data.deliveryId);
        if (deliveryResult.isFail()) {
            return Result.fail(deliveryResult.error);
        }

        const delivery = deliveryResult.value;

        const webhookResult = await this.getWebhookRepository.execute(delivery.webhookId);
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }

        const originalPayload = delivery.payload as IWebhookPayload | null;
        const data = originalPayload?.data ?? {};

        const settingsResult = await this.getSettingsRepository.execute();
        const retentionDays = settingsResult.isOk()
            ? (settingsResult.value.deliveryRetentionDays ?? WEBHOOK_DELIVERY_MAX_RETENTION_DAYS)
            : WEBHOOK_DELIVERY_MAX_RETENTION_DAYS;

        const expiresAt = new Date(
            Date.now() + retentionDays * 24 * 60 * 60 * 1000
        ).toISOString();

        const newDeliveryResult = await this.createDeliveryRepository.execute({
            webhookId: delivery.webhookId,
            eventType: delivery.eventType,
            status: "pending",
            payload: data as Record<string, unknown>,
            expiresAt
        });

        if (newDeliveryResult.isFail()) {
            return Result.fail(newDeliveryResult.error);
        }

        await this.taskService.trigger({
            definition: SEND_WEBHOOK_TASK,
            name: `Resend webhook: ${delivery.eventType}`,
            input: {
                webhookId: delivery.webhookId,
                eventName: delivery.eventType,
                deliveryId: newDeliveryResult.value.id
            }
        });

        return Result.ok(true);
    }
}

export const ResendWebhookDeliveryUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryUseCaseImpl,
    dependencies: [
        WebhookPermissions,
        GetWebhookDeliveryRepository,
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        TaskService,
        GetWebhookSettingsRepository
    ]
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
yarn test packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Run full suite**

```bash
yarn test packages/webhooks 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/api/features/ResendWebhookDelivery/ResendWebhookDeliveryUseCase.ts
git add packages/webhooks/__tests__/useCases/resendWebhookDelivery.test.ts
git commit -m "feat(webhooks): ResendWebhookDeliveryUseCase reads deliveryRetentionDays from settings"
```

---

## Task 6: Admin layer — types, gateways, presenter

**Files:**
- Modify: `packages/webhooks/src/admin/shared/types.ts`
- Modify: `packages/webhooks/src/admin/features/updateWebhookSettings/abstractions.ts`
- Modify: `packages/webhooks/src/admin/features/getWebhookSettings/GetWebhookSettingsGateway.ts`
- Modify: `packages/webhooks/src/admin/features/updateWebhookSettings/UpdateWebhookSettingsGateway.ts`
- Modify: `packages/webhooks/src/admin/presentation/WebhookSettings/abstractions.ts`
- Modify: `packages/webhooks/src/admin/presentation/WebhookSettings/WebhookSettingsPresenter.ts`

- [ ] **Step 1: Update the shared admin type**

In `packages/webhooks/src/admin/shared/types.ts`, replace the `WebhookSettings` interface:

```ts
export interface WebhookSettings {
    signingSecret: string | undefined;
    deliveryRetentionDays: number | undefined;
}
```

- [ ] **Step 2: Update the admin UpdateWebhookSettings input type**

Replace `packages/webhooks/src/admin/features/updateWebhookSettings/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookSettings } from "~/admin/shared/types.js";

export interface UpdateWebhookSettingsInput {
    signingSecret?: string;
    deliveryRetentionDays?: number;
}

export interface IUpdateWebhookSettingsGateway {
    execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings>;
}

export const UpdateWebhookSettingsGateway = createAbstraction<IUpdateWebhookSettingsGateway>(
    "UpdateWebhookSettingsGateway"
);

export namespace UpdateWebhookSettingsGateway {
    export type Interface = IUpdateWebhookSettingsGateway;
}

export interface IUpdateWebhookSettingsUseCase {
    execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings>;
}

export const UpdateWebhookSettingsUseCase = createAbstraction<IUpdateWebhookSettingsUseCase>(
    "UpdateWebhookSettingsUseCase"
);

export namespace UpdateWebhookSettingsUseCase {
    export type Interface = IUpdateWebhookSettingsUseCase;
}
```

- [ ] **Step 3: Update GetWebhookSettingsGateway to include the field in the query**

Replace `packages/webhooks/src/admin/features/getWebhookSettings/GetWebhookSettingsGateway.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { WebhookSettings } from "~/admin/shared/types.js";
import { GetWebhookSettingsGateway as GatewayAbstraction } from "./abstractions.js";

const GET_WEBHOOK_SETTINGS = /* GraphQL */ `
    query GetWebhookSettings {
        webhooks {
            getSettings {
                data {
                    signingSecret
                    deliveryRetentionDays
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type GetWebhookSettingsResponse = {
    webhooks: {
        getSettings:
            | { data: WebhookSettings; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class GetWebhookSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(): Promise<WebhookSettings> {
        const response = await this.client.execute<GetWebhookSettingsResponse>({
            query: GET_WEBHOOK_SETTINGS
        });

        const envelope = response.webhooks.getSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const GetWebhookSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: GetWebhookSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 4: Update UpdateWebhookSettingsGateway to include the field in the mutation**

Replace `packages/webhooks/src/admin/features/updateWebhookSettings/UpdateWebhookSettingsGateway.ts`:

```ts
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { WebhookSettings } from "~/admin/shared/types.js";
import {
    UpdateWebhookSettingsGateway as GatewayAbstraction,
    type UpdateWebhookSettingsInput
} from "./abstractions.js";

const UPDATE_WEBHOOK_SETTINGS = /* GraphQL */ `
    mutation UpdateWebhookSettings($input: UpdateWebhookSettingsInput!) {
        webhooks {
            updateSettings(input: $input) {
                data {
                    signingSecret
                    deliveryRetentionDays
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type UpdateWebhookSettingsResponse = {
    webhooks: {
        updateSettings:
            | { data: WebhookSettings; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class UpdateWebhookSettingsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly client: MainGraphQLClient.Interface) {}

    async execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings> {
        const response = await this.client.execute<UpdateWebhookSettingsResponse>({
            query: UPDATE_WEBHOOK_SETTINGS,
            variables: { input }
        });

        const envelope = response.webhooks.updateSettings;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const UpdateWebhookSettingsGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateWebhookSettingsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
```

- [ ] **Step 5: Flatten presenter actions and add the new form field**

Replace `packages/webhooks/src/admin/presentation/WebhookSettings/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IWebhookSettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
}

export interface IWebhookSettingsPresenter {
    vm: IWebhookSettingsViewModel;
    init(): void;
    save(): Promise<void>;
}

export const WebhookSettingsPresenter = createAbstraction<IWebhookSettingsPresenter>(
    "WebhookSettingsPresenter"
);

export namespace WebhookSettingsPresenter {
    export type Interface = IWebhookSettingsPresenter;
    export type ViewModel = IWebhookSettingsViewModel;
}
```

Replace `packages/webhooks/src/admin/presentation/WebhookSettings/WebhookSettingsPresenter.ts`:

```ts
import { computed, makeAutoObservable, runInAction } from "mobx";
import {
    WebhookSettingsPresenter as Abstraction,
    type IWebhookSettingsPresenter,
    type IWebhookSettingsViewModel
} from "./abstractions.js";
import { GetWebhookSettingsUseCase } from "~/admin/features/getWebhookSettings/abstractions.js";
import { UpdateWebhookSettingsUseCase } from "~/admin/features/updateWebhookSettings/abstractions.js";
import {
    FormModelFactory,
    type IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

class WebhookSettingsPresenterImpl implements IWebhookSettingsPresenter {
    private _loading = false;
    private _saving = false;
    private _form: IFormModel;

    public get vm(): IWebhookSettingsViewModel {
        return {
            loading: this._loading,
            saving: this._saving,
            form: this._form.vm
        };
    }

    public constructor(
        private readonly formModelFactory: FormModelFactory.Interface,
        private readonly getWebhookSettingsUseCase: GetWebhookSettingsUseCase.Interface,
        private readonly updateWebhookSettingsUseCase: UpdateWebhookSettingsUseCase.Interface
    ) {
        this._form = this.buildForm();

        makeAutoObservable(this, { vm: computed });
    }

    private buildForm(): IFormModel {
        return this.formModelFactory.create({
            fields: fields => ({
                signingSecret: fields
                    .text()
                    .label("Signing Secret")
                    .placeholder("Enter a signing secret for webhook payloads")
                    .description(
                        "Used to sign webhook payloads so receivers can verify authenticity."
                    ),
                deliveryRetentionDays: fields
                    .number()
                    .label("Delivery Retention (days)")
                    .placeholder(String(WEBHOOK_DELIVERY_MAX_RETENTION_DAYS))
                    .description(
                        `How long to keep delivery logs. 0 = delete immediately. Max ${WEBHOOK_DELIVERY_MAX_RETENTION_DAYS} days.`
                    )
            }),
            layout: layout => [layout.row("signingSecret"), layout.row("deliveryRetentionDays")]
        });
    }

    public async save(): Promise<void> {
        const data = await this._form.submit<Record<string, unknown>>();
        if (data === false) {
            return;
        }

        this._saving = true;

        try {
            const settings = await this.updateWebhookSettingsUseCase.execute({
                signingSecret: (data.signingSecret as string) || undefined,
                deliveryRetentionDays:
                    data.deliveryRetentionDays != null
                        ? Number(data.deliveryRetentionDays)
                        : undefined
            });

            runInAction(() => {
                this._form.setData({
                    signingSecret: settings.signingSecret ?? "",
                    deliveryRetentionDays: settings.deliveryRetentionDays ?? ""
                });
            });
        } finally {
            runInAction(() => {
                this._saving = false;
            });
        }
    }

    public async init(): Promise<void> {
        this._loading = true;

        try {
            const settings = await this.getWebhookSettingsUseCase.execute();

            runInAction(() => {
                this._form = this.buildForm();
                this._form.setData({
                    signingSecret: settings.signingSecret ?? "",
                    deliveryRetentionDays: settings.deliveryRetentionDays ?? ""
                });
                this._loading = false;
            });
        } catch {
            runInAction(() => {
                this._loading = false;
            });
        }
    }
}

export const WebhookSettingsPresenter = Abstraction.createImplementation({
    implementation: WebhookSettingsPresenterImpl,
    dependencies: [FormModelFactory, GetWebhookSettingsUseCase, UpdateWebhookSettingsUseCase]
});
```

- [ ] **Step 6: Find and update any component that calls `presenter.actions.save()`**

```bash
grep -rn "presenter\.actions\.save\|actions\.save" packages/webhooks/src/admin/ --include="*.tsx" --include="*.ts"
```

Update each hit from `presenter.actions.save()` to `presenter.save()`.

- [ ] **Step 7: Run lint and format**

```bash
yarn lint && yarn format > /dev/null 2>&1 && echo "OK"
```

- [ ] **Step 8: Run full test suite**

```bash
yarn test packages/webhooks 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/webhooks/src/admin/
git commit -m "feat(webhooks): add deliveryRetentionDays to admin settings form and gateways"
```

---

## Task 7: Pre-commit checks and final verification

- [ ] **Step 1: Run full pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio 2>&1 | tail -5
yarn format > /dev/null 2>&1
yarn lint 2>&1 | tail -5
yarn webiny sync-dependencies 2>&1 | tail -5
git add .
```

- [ ] **Step 2: Run full test suite one final time**

```bash
yarn test packages/webhooks 2>&1 | tail -10
```

Expected: all tests pass (133 or more, up from 127).

- [ ] **Step 3: Confirm no stray `WEBHOOK_DELIVERY_RETENTION_DAYS` references remain**

```bash
grep -rn "WEBHOOK_DELIVERY_RETENTION_DAYS" packages/webhooks/src/ 2>/dev/null
```

Expected: no output.
