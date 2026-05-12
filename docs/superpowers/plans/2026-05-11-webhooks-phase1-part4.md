# Webhooks Phase 1 — `webhooks` Core Package (Part 4 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the 4 GraphQL schema files, the `Extension.ts` entry point, and the `exports/api/webhooks.ts` public API.

**Part 1:** `2026-05-11-webhooks-phase1-part1.md` — scaffold, domain, abstractions, models (complete first)
**Part 2:** `2026-05-11-webhooks-phase1-part2.md` — implementations + tests (complete first)
**Part 3:** `2026-05-11-webhooks-phase1-part3.md` — use cases (complete first)

---

## Task 11: GraphQL schemas

### Schema overview

| File | Defines | Extends |
|---|---|---|
| `WebhookCrudSchema.ts` | `type WebhookQuery`, `type WebhookMutation`, `extend type Query`, `extend type Mutation`, all Webhook types, CRUD resolvers | — |
| `WebhookDeliverySchema.ts` | Delivery types, delivery resolvers | `extend type WebhookQuery`, `extend type WebhookMutation` |
| `WebhookEventSchema.ts` | Event types, event resolver | `extend type WebhookQuery` |
| `WebhookTriggerSchema.ts` | Trigger types, triggerWebhook resolver | `extend type WebhookMutation` |

### 11a: `WebhookCrudSchema`

**Files:**
- Create: `packages/webhooks/src/api/graphql/WebhookCrudSchema.ts`

- [ ] **Step 1: Create `src/api/graphql/WebhookCrudSchema.ts`**

```ts
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql";
import { ListWebhooksUseCase } from "~/api/features/ListWebhooks/abstractions.js";
import { GetWebhookUseCase } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/api/features/UpdateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/api/features/DeleteWebhook/abstractions.js";

class WebhookCrudSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookError {
                code: String
                message: String
                data: JSON
            }

            type WebhookListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type Webhook {
                id: ID!
                name: String!
                slug: String!
                endpointUrl: String!
                description: String
                enabled: Boolean!
                events: [String!]!
                signingSecret: String!
                createdOn: DateTime
                modifiedOn: DateTime
            }

            type WebhookResponse {
                data: Webhook
                error: WebhookError
            }

            type WebhookListResponse {
                data: [Webhook!]
                meta: WebhookListMeta
                error: WebhookError
            }

            input CreateWebhookInput {
                name: String!
                slug: String
                endpointUrl: String!
                description: String
                enabled: Boolean
                events: [String!]!
            }

            input UpdateWebhookInput {
                name: String
                slug: String
                endpointUrl: String
                description: String
                enabled: Boolean
                events: [String!]
            }

            input ListWebhooksWhereInput {
                enabled: Boolean
            }

            type WebhookQuery {
                listWebhooks(
                    where: ListWebhooksWhereInput
                    limit: Int
                    after: String
                ): WebhookListResponse!
                getWebhook(id: ID!): WebhookResponse!
            }

            type WebhookMutation {
                createWebhook(input: CreateWebhookInput!): WebhookResponse!
                updateWebhook(id: ID!, input: UpdateWebhookInput!): WebhookResponse!
                deleteWebhook(id: ID!): BooleanResponse!
            }

            extend type Query {
                webhooks: WebhookQuery!
            }

            extend type Mutation {
                webhooks: WebhookMutation!
            }
        `);

        builder.addResolver({
            path: "Query.webhooks",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.webhooks",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<{ where?: { enabled?: boolean }; limit?: number; after?: string }>({
            path: "WebhookQuery.listWebhooks",
            dependencies: [ListWebhooksUseCase],
            resolver: (listWebhooks: ListWebhooksUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listWebhooks.execute({
                        where: args.where ?? undefined,
                        limit: args.limit ?? undefined,
                        after: args.after ?? undefined
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookQuery.getWebhook",
            dependencies: [GetWebhookUseCase],
            resolver: (getWebhook: GetWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getWebhook.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ input: CreateWebhookUseCase.Input }>({
            path: "WebhookMutation.createWebhook",
            dependencies: [CreateWebhookUseCase],
            resolver: (createWebhook: CreateWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createWebhook.execute(args.input);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string; input: UpdateWebhookUseCase.Input }>({
            path: "WebhookMutation.updateWebhook",
            dependencies: [UpdateWebhookUseCase],
            resolver: (updateWebhook: UpdateWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await updateWebhook.execute(args.id, args.input);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookMutation.deleteWebhook",
            dependencies: [DeleteWebhookUseCase],
            resolver: (deleteWebhook: DeleteWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteWebhook.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: WebhookCrudSchema,
    dependencies: []
});
```

---

### 11b: `WebhookDeliverySchema`

**Files:**
- Create: `packages/webhooks/src/api/graphql/WebhookDeliverySchema.ts`

- [ ] **Step 2: Create `src/api/graphql/WebhookDeliverySchema.ts`**

```ts
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql";
import { ListWebhookDeliveriesUseCase } from "~/api/features/ListWebhookDeliveries/abstractions.js";
import { GetWebhookDeliveryUseCase } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/api/features/ResendWebhookDelivery/abstractions.js";

class WebhookDeliverySchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookDelivery {
                id: ID!
                webhookId: ID!
                backgroundTaskId: String!
                eventType: String!
                payload: JSON
                requestHeaders: JSON
                responseTime: Int
                responseStatus: Int
                responseBody: String
                expiresAt: DateTime
                createdOn: DateTime
            }

            type WebhookDeliveryResponse {
                data: WebhookDelivery
                error: WebhookError
            }

            type WebhookDeliveryListResponse {
                data: [WebhookDelivery!]
                meta: WebhookListMeta
                error: WebhookError
            }

            extend type WebhookQuery {
                listWebhookDeliveries(
                    webhookId: ID!
                    limit: Int
                    after: String
                ): WebhookDeliveryListResponse!
                getWebhookDelivery(id: ID!): WebhookDeliveryResponse!
            }

            extend type WebhookMutation {
                resendWebhookDelivery(id: ID!): BooleanResponse!
            }
        `);

        builder.addResolver<{ webhookId: string; limit?: number; after?: string }>({
            path: "WebhookQuery.listWebhookDeliveries",
            dependencies: [ListWebhookDeliveriesUseCase],
            resolver: (listDeliveries: ListWebhookDeliveriesUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listDeliveries.execute({
                        webhookId: args.webhookId,
                        limit: args.limit ?? undefined,
                        after: args.after ?? undefined
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookQuery.getWebhookDelivery",
            dependencies: [GetWebhookDeliveryUseCase],
            resolver: (getDelivery: GetWebhookDeliveryUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getDelivery.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookMutation.resendWebhookDelivery",
            dependencies: [ResendWebhookDeliveryUseCase],
            resolver: (resend: ResendWebhookDeliveryUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await resend.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: WebhookDeliverySchema,
    dependencies: []
});
```

---

### 11c: `WebhookEventSchema`

**Files:**
- Create: `packages/webhooks/src/api/graphql/WebhookEventSchema.ts`

- [ ] **Step 3: Create `src/api/graphql/WebhookEventSchema.ts`**

```ts
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql";
import { ListAvailableWebhookEventsUseCase } from "~/api/features/ListAvailableWebhookEvents/abstractions.js";

class WebhookEventSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookEvent {
                app: String!
                modelId: String!
                eventName: String!
                label: String!
            }

            type WebhookEventListResponse {
                data: [WebhookEvent!]
                error: WebhookError
            }

            extend type WebhookQuery {
                listAvailableWebhookEvents: WebhookEventListResponse!
            }
        `);

        builder.addResolver({
            path: "WebhookQuery.listAvailableWebhookEvents",
            dependencies: [ListAvailableWebhookEventsUseCase],
            resolver: (listEvents: ListAvailableWebhookEventsUseCase.Interface) => {
                return async () => {
                    const result = await listEvents.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: WebhookEventSchema,
    dependencies: []
});
```

---

### 11d: `WebhookTriggerSchema`

**Files:**
- Create: `packages/webhooks/src/api/graphql/WebhookTriggerSchema.ts`

- [ ] **Step 4: Create `src/api/graphql/WebhookTriggerSchema.ts`**

Adds `triggerWebhook(id: ID!, payload: JSON!): WebhookTriggerResponse` — fires a test delivery regardless of enabled state, using the caller-supplied payload.

```ts
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";

class WebhookTriggerSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookTriggerResponse {
                data: WebhookDelivery
                error: WebhookError
            }

            extend type WebhookMutation {
                triggerWebhook(id: ID!, payload: JSON!): WebhookTriggerResponse!
            }
        `);

        builder.addResolver<{ id: string; payload: Record<string, unknown> }>({
            path: "WebhookMutation.triggerWebhook",
            dependencies: [TriggerWebhookUseCase],
            resolver: (triggerWebhook: TriggerWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await triggerWebhook.execute(args.id, args.payload);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: WebhookTriggerSchema,
    dependencies: []
});
```

- [ ] **Step 5: Build schemas**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add packages/webhooks/src/api/graphql/
git commit -m "feat(webhooks): add GraphQL schemas (CRUD, delivery, events, trigger)"
```

---

## Task 12: Extension, exports, and final wiring

**Files:**
- Create: `packages/webhooks/src/api/Extension.ts`
- Create: `packages/webhooks/src/exports/api/webhooks.ts`
- Modify: `packages/webhooks/index.ts`

- [ ] **Step 1: Create `src/api/Extension.ts`**

This is the single entry point consumers call. It registers all models, features, schemas, and the background task.

```ts
import { createFeature } from "@webiny/feature/api";
import WebhookModel from "./models/WebhookModel.js";
import WebhookDeliveryModel from "./models/WebhookDeliveryModel.js";
import WebhookCrudSchema from "./graphql/WebhookCrudSchema.js";
import WebhookDeliverySchema from "./graphql/WebhookDeliverySchema.js";
import WebhookEventSchema from "./graphql/WebhookEventSchema.js";
import WebhookTriggerSchema from "./graphql/WebhookTriggerSchema.js";
import { CreateWebhookFeature } from "./features/CreateWebhook/feature.js";
import { GetWebhookFeature } from "./features/GetWebhook/feature.js";
import { ListWebhooksFeature } from "./features/ListWebhooks/feature.js";
import { UpdateWebhookFeature } from "./features/UpdateWebhook/feature.js";
import { DeleteWebhookFeature } from "./features/DeleteWebhook/feature.js";
import { CreateWebhookDeliveryFeature } from "./features/CreateWebhookDelivery/feature.js";
import { GetWebhookDeliveryFeature } from "./features/GetWebhookDelivery/feature.js";
import { ListWebhookDeliveriesFeature } from "./features/ListWebhookDeliveries/feature.js";
import { ResendWebhookDeliveryFeature } from "./features/ResendWebhookDelivery/feature.js";
import { TriggerWebhookFeature } from "./features/TriggerWebhook/feature.js";
import { ListAvailableWebhookEventsFeature } from "./features/ListAvailableWebhookEvents/feature.js";
import { WebhookSignPayloadFeature } from "./features/WebhookSignPayload/feature.js";
import { WebhookDispatcherFeature } from "./features/WebhookDispatcher/feature.js";
import { SendWebhookTaskFeature } from "./features/SendWebhookTask/feature.js";

export const Extension = createFeature({
    name: "WebhookManagement",
    register(container) {
        // CMS models
        container.register(WebhookModel);
        container.register(WebhookDeliveryModel);

        // GraphQL
        container.register(WebhookCrudSchema);
        container.register(WebhookDeliverySchema);
        container.register(WebhookEventSchema);
        container.register(WebhookTriggerSchema);

        // Core implementations
        WebhookSignPayloadFeature.register(container);
        WebhookDispatcherFeature.register(container);
        SendWebhookTaskFeature.register(container);

        // Webhook CRUD
        CreateWebhookFeature.register(container);
        GetWebhookFeature.register(container);
        ListWebhooksFeature.register(container);
        UpdateWebhookFeature.register(container);
        DeleteWebhookFeature.register(container);

        // Delivery log
        CreateWebhookDeliveryFeature.register(container);
        GetWebhookDeliveryFeature.register(container);
        ListWebhookDeliveriesFeature.register(container);
        ResendWebhookDeliveryFeature.register(container);

        // Trigger + events
        TriggerWebhookFeature.register(container);
        ListAvailableWebhookEventsFeature.register(container);
    }
});
```

- [ ] **Step 2: Create `src/exports/api/webhooks.ts`**

Public API surface for bridge packages.

```ts
// Abstractions bridge packages implement or consume
export { WebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";
export { WebhookEventProvider } from "@webiny/api-core/features/webhooks/abstractions.js";
export { WebhookSignPayload } from "@webiny/api-core/features/webhooks/abstractions.js";

// Domain types bridge packages reference
export type {
    IWebhook,
    IWebhookValues,
    IWebhookDelivery,
    IWebhookDeliveryValues,
    IWebhookEventDefinition,
    IWebhookPayload,
    IListMeta
} from "~/api/domain/types.js";

// Extension for framework wiring
export { Extension } from "~/api/Extension.js";
```

- [ ] **Step 3: Update `index.ts` to include exports path**

Replace the current `index.ts`:

```ts
export { Extension } from "./src/api/Extension.js";
export { WebhookDispatcher } from "@webiny/api-core/features/webhooks/abstractions.js";
export { WebhookEventProvider } from "@webiny/api-core/features/webhooks/abstractions.js";
export { WebhookSignPayload } from "@webiny/api-core/features/webhooks/abstractions.js";
```

(Verify it matches what was set up in Task 1.)

- [ ] **Step 4: Final build**

```bash
yarn build -p @webiny/webhooks 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 5: Run all tests**

```bash
yarn test packages/webhooks 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 6: Run before-commit checklist**

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

Expected: no errors. Fix any lint issues before committing.

- [ ] **Step 7: Commit**

```bash
git add packages/webhooks/src/api/Extension.ts packages/webhooks/src/exports/ packages/webhooks/index.ts
git commit -m "feat(webhooks): add Extension entry point and public exports"
```

---

## Phase 1 complete

`packages/webhooks` is now a fully functional core webhook package:

- **2 CMS models** — Webhook, WebhookDelivery
- **14 use cases** — full CRUD, delivery log, trigger, event discovery
- **1 background task** — `SendWebhookTask` (HTTP POST + delivery log)
- **2 core implementations** — `WebhookSignPayload` (HMAC-SHA256), `WebhookDispatcher` (event router)
- **4 GraphQL schemas** — complete `webhooks { ... }` query and mutation namespace
- **7 unit tests** — covering signing, dispatch routing, and task delivery behavior

**Next:** Phase 2 — `packages/api-headless-cms-webhooks` (CMS bridge)
See: `docs/superpowers/plans/2026-05-11-webhooks-phase2-cms-bridge.md`
