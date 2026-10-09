### Task 1: Remove the old review-state code, the old GraphQL schema and their consumers

**Files:**
- Delete (api-workflows): `packages/api-workflows/src/WorkflowsSchemaFactory.ts`, `packages/api-workflows/src/graphql/` (whole folder), `packages/api-workflows/src/domain/workflowState/` (whole folder), `packages/api-workflows/src/features/workflowState/` (whole folder, incl. `README.md`), `packages/api-workflows/src/features/internal/` (whole folder), `packages/api-workflows/__tests__/graphql/`, `packages/api-workflows/__tests__/validation/`, `packages/api-workflows/__tests__/__helpers/graphql.ts`, `packages/api-workflows/__tests__/WorkflowStateUseCases.test.ts`
- Modify (api-workflows): `packages/api-workflows/src/WorkflowsFeature.ts`, `packages/api-workflows/src/features/WorkflowModelProviders.ts`, `packages/api-workflows/src/constants.ts`, `packages/api-workflows/__tests__/__helpers/handler.ts`, `packages/api-workflows/__tests__/registration.test.ts`, `packages/api-workflows/package.json` (as `yarn adio` reports)
- Delete (CMS): `packages/api-headless-cms-workflows/src/features/EntryWorkflows/` (whole folder), `packages/api-headless-cms-workflows/src/utils/state.ts`, `packages/api-headless-cms-workflows/src/utils/modelAllowed.ts`, `packages/api-headless-cms-workflows/__tests__/entry/`, `packages/api-headless-cms-workflows/__tests__/state/`
- Modify (CMS): `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`, `packages/api-headless-cms-workflows/package.json` (as `yarn adio` reports)
- Delete (WB): `packages/api-website-builder-workflows/src/features/` (whole folder), `packages/api-website-builder-workflows/src/utils/` (whole folder)
- Modify (WB): `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`, `packages/api-website-builder-workflows/package.json` (as `yarn adio` reports)

**Interfaces:**
- Consumes: `GetModelUseCase` (`@webiny/api-headless-cms/features/contentModel/GetModel/index.js`), `createCmsTestHandler`, `CmsTestHandlerParams` (`@webiny/api-headless-cms-testing`), old `CreateWorkflowUseCase` / `UpdateWorkflowUseCase` (still present until Task 3).
- Produces: `WorkflowsFeature` registers only the workflow model, workflow features and notifications. Test helper `createContextHandler(params?: CmsTestHandlerParams): Promise<{ handler; context }>` that registers `WorkflowsFeature` and then runs `params.setup`. `CmsWorkflowsFeature` registers only the local `WorkflowsFeature` (publishable-model check) and the CMS endpoint `system.workflow` schema extension. `WebsiteBuilderWorkflowsFeature` registers only `WebsiteBuilderPageSchemaFactory`.

- [ ] **Step 1: Write the failing test**

Replace `packages/api-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { CreateWorkflowUseCase } from "~/features/workflow/CreateWorkflow/index.js";
import { UpdateWorkflowUseCase } from "~/features/workflow/UpdateWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers create and update workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(CreateWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(UpdateWorkflowUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL in "does not register the old workflow state model": `expected false to be true`.

- [ ] **Step 3: Delete the old review-state code in api-workflows**

```bash
git rm -r -q packages/api-workflows/src/WorkflowsSchemaFactory.ts \
  packages/api-workflows/src/graphql \
  packages/api-workflows/src/domain/workflowState \
  packages/api-workflows/src/features/workflowState \
  packages/api-workflows/src/features/internal \
  packages/api-workflows/__tests__/graphql \
  packages/api-workflows/__tests__/validation \
  packages/api-workflows/__tests__/__helpers/graphql.ts \
  packages/api-workflows/__tests__/WorkflowStateUseCases.test.ts
```

- [ ] **Step 4: Rewire api-workflows without the deleted code**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const WORKFLOWS_PERMISSION = "workflows";
```

Replace `packages/api-workflows/src/features/WorkflowModelProviders.ts` with:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * Resolve the tenant's workflow model on demand. No memoization (`ModelsFetcher` caches per
 * request) and no `withoutAuthorization` (private models skip model authorization).
 */
class WorkflowModelProviderImplementation implements WorkflowModelProvider.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowModelProviderImpl = WorkflowModelProvider.createImplementation({
    implementation: WorkflowModelProviderImplementation,
    dependencies: [GetModelUseCase]
});
```

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel as WorkflowPrivateModel } from "./domain/workflow/workflowModel.js";
import { WorkflowModelProviderImpl } from "~/features/WorkflowModelProviders.js";
import { WorkflowMapper } from "~/domain/workflow/WorkflowMapper.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { CreateWorkflowFeature } from "~/features/workflow/CreateWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { UpdateWorkflowFeature } from "~/features/workflow/UpdateWorkflow/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "./features/notifications/NotificationTransport/index.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Register private CMS model definitions early so HeadlessCmsInitializerImpl
        // picks them up when it builds the model list during the enhance phase.
        container.register(WorkflowPrivateModel);
        container.register(WorkflowModelProviderImpl);
        container.register(WorkflowMapper);

        // Notifications
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        CreateWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        UpdateWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);
    }
});
```

Replace `packages/api-workflows/__tests__/__helpers/handler.ts` with:

```ts
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";

/**
 * Request context with `WorkflowsFeature` registered. `params.setup` runs after it, so tests can
 * register fakes and decorators on top of the workflows abstractions.
 */
export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        setup: async container => {
            WorkflowsFeature.register(container);
            await params.setup?.(container);
        },
        permissions: params.permissions ?? [{ name: "*" }]
    });
    const context = await handler.getContext();

    return {
        handler,
        context
    };
};
```

- [ ] **Step 5: Remove the CMS entry handlers that used the old review state**

```bash
git rm -r -q packages/api-headless-cms-workflows/src/features/EntryWorkflows \
  packages/api-headless-cms-workflows/src/utils/state.ts \
  packages/api-headless-cms-workflows/src/utils/modelAllowed.ts \
  packages/api-headless-cms-workflows/__tests__/entry \
  packages/api-headless-cms-workflows/__tests__/state
```

Replace `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { createEntrySystemSchemaExtension } from "./graphql/entrySystemSchema.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Entry handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as target adapters in phase 2.
        CmsLocalWorkflowsFeature.register(container);

        // Add the `workflow` field to CmsEntrySystem on the CMS endpoint, which is served from the
        // separate CMS schema and needs its own CmsGraphQLSchemaFactory entry.
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => [createEntrySystemSchemaExtension()]
        });
    }
});
```

- [ ] **Step 6: Remove the Website Builder page handlers that used the old review state**

```bash
git rm -r -q packages/api-website-builder-workflows/src/features \
  packages/api-website-builder-workflows/src/utils
```

Replace `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WebsiteBuilderPageSchemaFactory } from "./WebsiteBuilderPageSchemaFactory.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Page handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as the `wb.page` target adapter in phase 2.
        container.register(WebsiteBuilderPageSchemaFactory);
    }
});
```

- [ ] **Step 7: Align package dependencies**

Run: `yarn adio 2>&1 | tail -40`
Remove every dependency it reports as unused and move test-only ones to `devDependencies`. Expected (verify against the output):
- `packages/api-workflows/package.json`: remove `@webiny/api-graphql` and `graphql`.
- `packages/api-headless-cms-workflows/package.json`: remove `@webiny/api`, `@webiny/error`, `@webiny/shared-aco`; move `@webiny/api-aco` to `devDependencies` (used by `__tests__/__handler/context.ts`).
- `packages/api-website-builder-workflows/package.json`: remove `@webiny/api`, `@webiny/api-aco`, `@webiny/api-workflows`, `@webiny/error`, `@webiny/shared-aco`.

Then run `node scripts/generateTsConfigsInPackages.js` and `yarn adio 2>&1 | tail -20` again; expected: no findings for these packages.

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (`registration.test.ts`, `WorkflowUseCases.test.ts`, `WorkflowMapper.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (`registration.test.ts`, `entrySystemSchema.test.ts`, `workflows/disallowUnpublishableModels.test.ts`).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (`wbPageSystem.test.ts`).
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 9: Build**

Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-event-handler-core 2>&1 | tail -30`
Expected: all succeed.

- [ ] **Step 10: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "refactor(api-workflows): remove the old review state domain and GraphQL schema

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

