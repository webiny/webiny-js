### Task 17: WB workflow store, delete, list and get wrappers

Spec 4.1, 8, D78, D115, D131, D132, D133, R45, R46, R57-R60, R76, R78, R80. The Website Builder mirror of Task 12, on the shared building blocks of Task 6b, for workflows bound to `wb.page` (the only WB namespace in v1). The list needs no paging loop: `models_in: ["wb.page"]` returns at most one workflow (D15).

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/shared/wbWorkflows.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/StoreWebsiteBuilderPageWorkflowUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/DeleteWebsiteBuilderPageWorkflowUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/ListWebsiteBuilderPageWorkflowsUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/GetWebsiteBuilderPageWorkflowUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/RecordingEventPublisher.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts`

**Interfaces:**
- Consumes: as Task 12 (incl. `ReadableBlockingReviewsService` (`MAX_BLOCKING_REVIEWS`, `MAX_BLOCKING_REVIEW_CHECKS`), `belongsToApp`, `isAppWorkflow` from Task 6b), with `WbPageTargetReader` and `WbPageAccess` (Task 15) instead of the CMS ones.
- Produces:
  - `shared/wbWorkflows.ts`: `isWbPageNamespace(model: string): boolean`, `belongsToWb(models: string[]): boolean`, `isWbWorkflow(workflow: WorkflowValues): boolean`, `WB_PAGES_ONLY` message.
  - Test helper `RecordingEventPublisher` + `recordedEvents` (same content as the CMS package's, Task 12).
  - `StoreWebsiteBuilderPageWorkflowUseCase` (`StoreWebsiteBuilderPageWorkflowInput { workflow: WorkflowValues; savedOn?: string | null }`), `DeleteWebsiteBuilderPageWorkflowUseCase` (`DeleteWebsiteBuilderPageWorkflowInput { id: string }`), `ListWebsiteBuilderPageWorkflowsUseCase` (`execute(): Promise<Result<Workflow[], Error>>`), `GetWebsiteBuilderPageWorkflowUseCase` (`GetWebsiteBuilderPageWorkflowInput { id: string }`), with the same results and errors as their CMS counterparts.
  - `WbWrappersFeature` (registered by `WebsiteBuilderWorkflowsFeature`); Task 18 adds to it.

- [ ] **Step 1: Write the failing test**

Create `packages/api-website-builder-workflows/__tests__/__helpers/RecordingEventPublisher.ts` with exactly the content of `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingEventPublisher.ts` (Task 12).

Create `packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowHasActiveReviewsErrorData } from "@webiny/api-workflows/domain/workflow/errors.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    createWbWorkflowValues,
    requestPageReview,
    storeWbWorkflow,
    WB_ADMIN_ACTOR
} from "~tests/__helpers/engine.js";
import { ARTICLE_NAMESPACE } from "~tests/__helpers/cmsModel.js";
import {
    EDITOR,
    READER,
    toActor,
    WB_READER,
    WORKFLOWS_EDITOR
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.js";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageWorkflows/index.js";
import { GetWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/GetWebsiteBuilderPageWorkflow/index.js";

const createEditorContext = () => {
    return createUserContext({ identity: EDITOR, permissions: [WORKFLOWS_EDITOR, ...WB_READER] });
};

/** As `createEditorContext`, recording every published event (R80). */
const createRecordingEditorContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: EDITOR,
        permissions: [WORKFLOWS_EDITOR, ...WB_READER],
        legacyPlugins: [
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

const createReaderContext = () => {
    return createUserContext({ identity: READER, permissions: WB_READER });
};

const store = (context: CmsContext, workflow = createWbWorkflowValues(), savedOn?: string) => {
    return context.container
        .resolve(StoreWebsiteBuilderPageWorkflowUseCase)
        .execute({ workflow, savedOn });
};

const remove = (context: CmsContext, id: string) => {
    return context.container.resolve(DeleteWebsiteBuilderPageWorkflowUseCase).execute({ id });
};

/** A Headless CMS workflow stored through the engine (no wrapper). */
const storeCmsWorkflow = async (context: CmsContext) => {
    return expectOk(
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: {
                ...createWbWorkflowValues(),
                id: "cms-workflow",
                name: "Articles review",
                models: [ARTICLE_NAMESPACE]
            },
            actor: WB_ADMIN_ACTOR
        })
    );
};

describe("WB workflow wrappers", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("stores a pages workflow for an editor and passes savedOn through (D131)", async () => {
        const editor = await createEditorContext();

        const created = expectOk(await store(editor));
        const stale = await store(
            editor,
            { ...createWbWorkflowValues(), name: "Changed" },
            "2000-01-01T00:00:00.000Z"
        );
        const updated = await store(
            editor,
            { ...createWbWorkflowValues(), name: "Changed" },
            created.savedOn
        );

        expect(created.savedBy.id).toBe(EDITOR.id);
        expect(stale.error.code).toBe("Workflows/Workflow/Conflict");
        expect(updated.isOk()).toBe(true);
    });

    it("passes the caller as the actor of the store and delete events (R58, R80)", async () => {
        const editor = await createRecordingEditorContext();

        const created = expectOk(await store(editor));
        expectOk(await remove(editor, created.id));

        const actors = recordedEvents
            .filter(event => event.eventType.startsWith("Workflows/Workflow/"))
            .map(event => [event.eventType, event.payload.actor]);
        const actor = toActor(EDITOR);
        expect(actors).toEqual([
            ["Workflows/Workflow/BeforeCreate", actor],
            ["Workflows/Workflow/AfterCreate", actor],
            ["Workflows/Workflow/BeforeDelete", actor],
            ["Workflows/Workflow/AfterDelete", actor]
        ]);
    });

    it("refuses to store or delete a workflow without editor (R60)", async () => {
        await storeWbWorkflow(await createUserContext());
        const reader = await createReaderContext();

        const stored = await store(reader);
        const deleted = await remove(reader, "wb-workflow");

        expect(stored.error.code).toBe("Workflows/NotAuthorized");
        expect(stored.error.data).toEqual({ action: "manage workflows" });
        expect(deleted.error.code).toBe("Workflows/NotAuthorized");
    });

    it("refuses an anonymous identity", async () => {
        const anonymous = await createUserContext({ identity: null, permissions: [] });

        const stored = await store(anonymous);
        const listed = await anonymous.container
            .resolve(ListWebsiteBuilderPageWorkflowsUseCase)
            .execute();

        expect(stored.error.code).toBe("Workflows/NotAuthenticated");
        expect(listed.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("binds Website Builder workflows to pages only (R46)", async () => {
        const editor = await createEditorContext();

        const result = await store(editor, {
            ...createWbWorkflowValues(),
            models: [ARTICLE_NAMESPACE]
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'A Website Builder workflow can only be bound to pages ("wb.page").'
        );
    });

    it("does not rebind a Headless CMS workflow (R46)", async () => {
        await storeCmsWorkflow(await createUserContext());
        const editor = await createEditorContext();

        const result = await store(editor, { ...createWbWorkflowValues(), id: "cms-workflow" });

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("lists and gets Website Builder workflows only", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        await storeCmsWorkflow(admin);
        const reader = await createReaderContext();

        const listed = expectOk(
            await reader.container.resolve(ListWebsiteBuilderPageWorkflowsUseCase).execute()
        );
        const wb = await reader.container
            .resolve(GetWebsiteBuilderPageWorkflowUseCase)
            .execute({ id: "wb-workflow" });
        const cms = await reader.container
            .resolve(GetWebsiteBuilderPageWorkflowUseCase)
            .execute({ id: "cms-workflow" });

        expect(listed.map(workflow => workflow.id)).toEqual(["wb-workflow"]);
        expect(wb.isOk()).toBe(true);
        expect(cms.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("deletes a pages workflow for an editor and not another app's", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        await storeCmsWorkflow(admin);
        const editor = await createEditorContext();

        const deleted = await remove(editor, "wb-workflow");
        const cms = await remove(editor, "cms-workflow");

        expect(deleted.isOk()).toBe(true);
        expect(cms.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("lists at most five readable blocking reviews and keeps the exact count (D115)", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        // Locked and readable pages interleaved, so the result does not depend on list order.
        const lockedRevisionIds: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const locked = await createPage(admin, {
                title: `Locked ${i}`,
                folderId: "folder-locked"
            });
            lockedRevisionIds.push(locked.id);
            await requestPageReview(admin, locked);
            await requestPageReview(admin, await createPage(admin, { title: `Open ${i}` }));
        }
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await createEditorContext();

        const blocked = await remove(editor, "wb-workflow");

        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(data.count).toBe(12);
        expect(data.reviews).toHaveLength(5);
        expect(data.reviews.some(review => lockedRevisionIds.includes(review.targetRevisionId))).toBe(
            false
        );
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js`.

- [ ] **Step 3: Shared helpers**

Create `packages/api-website-builder-workflows/src/features/wrappers/shared/wbWorkflows.ts`:

```ts
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { belongsToApp, isAppWorkflow } from "@webiny/api-workflows/domain/workflow/isAppWorkflow.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

export const WB_PAGES_ONLY = 'A Website Builder workflow can only be bound to pages ("wb.page").';

/** The only Website Builder namespace in v1. */
export const isWbPageNamespace = (model: string): boolean => {
    return model === WB_PAGE_NAMESPACE;
};

/** Every model is `wb.page`; an empty list is left to the engine's validation. */
export const belongsToWb = (models: string[]): boolean => {
    return belongsToApp(models, isWbPageNamespace);
};

/** A stored workflow of the Website Builder app (R46). */
export const isWbWorkflow = (workflow: WorkflowValues): boolean => {
    return isAppWorkflow(workflow, isWbPageNamespace);
};
```

- [ ] **Step 4: StoreWebsiteBuilderPageWorkflow**

Create `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow, WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";

export interface StoreWebsiteBuilderPageWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the editor loaded; omit when creating (D131). */
    savedOn?: string | null;
}

export interface IStoreWebsiteBuilderPageWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    store: StoreWorkflowUseCase.Error;
}

type UseCaseError =
    IStoreWebsiteBuilderPageWorkflowUseCaseErrors[keyof IStoreWebsiteBuilderPageWorkflowUseCaseErrors];

export interface IStoreWebsiteBuilderPageWorkflowUseCase {
    execute(input: StoreWebsiteBuilderPageWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update the pages workflow (spec 4.1, D131, D132): needs `workflows.editor`; models
 * must be `wb.page`; a workflow of another app is never overwritten (R46, R60).
 */
export const StoreWebsiteBuilderPageWorkflowUseCase =
    createAbstraction<IStoreWebsiteBuilderPageWorkflowUseCase>(
        "StoreWebsiteBuilderPageWorkflowUseCase"
    );

export namespace StoreWebsiteBuilderPageWorkflowUseCase {
    export type Interface = IStoreWebsiteBuilderPageWorkflowUseCase;
    export type Input = StoreWebsiteBuilderPageWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/StoreWebsiteBuilderPageWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowNotFoundError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { belongsToWb, isWbWorkflow, WB_PAGES_ONLY } from "../shared/wbWorkflows.js";
import { StoreWebsiteBuilderPageWorkflowUseCase as UseCase } from "./abstractions.js";


class StoreWebsiteBuilderPageWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private storeWorkflow: StoreWorkflowUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        if (!(await this.permissions.canEdit())) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "manage workflows" }));
        }
        if (!belongsToWb(input.workflow.models)) {
            return Result.fail(new WorkflowValidationError(WB_PAGES_ONLY));
        }

        // Never overwrite another app's workflow under the same id (R46).
        const existing = await this.getWorkflow.execute({ id: input.workflow.id });
        if (existing.isFail() && !(existing.error instanceof WorkflowNotFoundError)) {
            return Result.fail(existing.error);
        }
        if (existing.isOk() && !isWbWorkflow(existing.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflow.id }));
        }

        return this.storeWorkflow.execute({
            workflow: input.workflow,
            savedOn: input.savedOn,
            actor: actor.value
        });
    }
}

export const StoreWebsiteBuilderPageWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWebsiteBuilderPageWorkflowUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, GetWorkflowUseCase, StoreWorkflowUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "./StoreWebsiteBuilderPageWorkflowUseCase.js";

export const StoreWebsiteBuilderPageWorkflowFeature = createFeature({
    name: "WebsiteBuilderWorkflows/StoreWebsiteBuilderPageWorkflow",
    register(container) {
        container.register(StoreWebsiteBuilderPageWorkflowUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.ts`:

```ts
export { StoreWebsiteBuilderPageWorkflowUseCase } from "./abstractions.js";
export type { StoreWebsiteBuilderPageWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 5: DeleteWebsiteBuilderPageWorkflow**

Create `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import type { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";

export interface DeleteWebsiteBuilderPageWorkflowInput {
    id: string;
}

export interface IDeleteWebsiteBuilderPageWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    get: GetWorkflowUseCase.Error;
    delete: DeleteWorkflowUseCase.Error;
}

type UseCaseError =
    IDeleteWebsiteBuilderPageWorkflowUseCaseErrors[keyof IDeleteWebsiteBuilderPageWorkflowUseCaseErrors];

export interface IDeleteWebsiteBuilderPageWorkflowUseCase {
    execute(input: DeleteWebsiteBuilderPageWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Delete the pages workflow (spec 4.1, D132): needs `workflows.editor`. When reviews are in
 * progress, the error keeps the exact count and lists up to 5 the caller can read (D115, R57).
 */
export const DeleteWebsiteBuilderPageWorkflowUseCase =
    createAbstraction<IDeleteWebsiteBuilderPageWorkflowUseCase>(
        "DeleteWebsiteBuilderPageWorkflowUseCase"
    );

export namespace DeleteWebsiteBuilderPageWorkflowUseCase {
    export type Interface = IDeleteWebsiteBuilderPageWorkflowUseCase;
    export type Input = DeleteWebsiteBuilderPageWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/DeleteWebsiteBuilderPageWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowHasActiveReviewsError,
    WorkflowNotFoundError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { ReadableBlockingReviewsService } from "@webiny/api-workflows/features/workflow/ReadableBlockingReviews/index.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWebsiteBuilderPageWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private deleteWorkflow: DeleteWorkflowUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private readableBlockingReviews: ReadableBlockingReviewsService.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        if (!(await this.permissions.canEdit())) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "manage workflows" }));
        }

        const existing = await this.getWorkflow.execute({ id: input.id });
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        if (!isWbWorkflow(existing.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }

        const deleted = await this.deleteWorkflow.execute({ id: input.id, actor: actor.value });
        if (deleted.isFail() && deleted.error instanceof WorkflowHasActiveReviewsError) {
            // The first 5 the caller can read, at most 50 checked; the count stays exact (D115, R76).
            // A failed read throws, which the service counts as unreadable.
            const reviews = await this.readableBlockingReviews.filter(
                deleted.error.data.reviews,
                async review => {
                    const target = await this.targets.read({
                        model: review.model,
                        targetRevisionId: review.targetRevisionId
                    });
                    return target !== null && (await this.access.canRead(target));
                }
            );
            return Result.fail(
                new WorkflowHasActiveReviewsError({ count: deleted.error.data.count, reviews })
            );
        }
        return deleted;
    }
}

export const DeleteWebsiteBuilderPageWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWebsiteBuilderPageWorkflowUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        GetWorkflowUseCase,
        DeleteWorkflowUseCase,
        WbPageTargetReader,
        WbPageAccess,
        ReadableBlockingReviewsService
    ]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "./DeleteWebsiteBuilderPageWorkflowUseCase.js";

export const DeleteWebsiteBuilderPageWorkflowFeature = createFeature({
    name: "WebsiteBuilderWorkflows/DeleteWebsiteBuilderPageWorkflow",
    register(container) {
        container.register(DeleteWebsiteBuilderPageWorkflowUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.ts`:

```ts
export { DeleteWebsiteBuilderPageWorkflowUseCase } from "./abstractions.js";
export type { DeleteWebsiteBuilderPageWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 6: ListWebsiteBuilderPageWorkflows and GetWebsiteBuilderPageWorkflow**

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface IListWebsiteBuilderPageWorkflowsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListWebsiteBuilderPageWorkflowsUseCaseErrors[keyof IListWebsiteBuilderPageWorkflowsUseCaseErrors];

export interface IListWebsiteBuilderPageWorkflowsUseCase {
    execute(): Promise<Result<Workflow[], UseCaseError>>;
}

/** The pages workflow (at most one in v1, D15), for any signed-in identity (D78, R59). */
export const ListWebsiteBuilderPageWorkflowsUseCase =
    createAbstraction<IListWebsiteBuilderPageWorkflowsUseCase>(
        "ListWebsiteBuilderPageWorkflowsUseCase"
    );

export namespace ListWebsiteBuilderPageWorkflowsUseCase {
    export type Interface = IListWebsiteBuilderPageWorkflowsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow[], UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/ListWebsiteBuilderPageWorkflowsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { ListWebsiteBuilderPageWorkflowsUseCase as UseCase } from "./abstractions.js";

/** v1 binds one workflow per model (D15); a few extra cover the accepted save race (D41). */
const LIMIT = 10;

class ListWebsiteBuilderPageWorkflowsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface
    ) {}

    public async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const listed = await this.listWorkflows.execute({
            where: { models_in: [WB_PAGE_NAMESPACE] },
            limit: LIMIT
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        return Result.ok(listed.value.items.filter(isWbWorkflow));
    }
}

export const ListWebsiteBuilderPageWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageWorkflowsUseCaseImpl,
    dependencies: [CurrentReviewViewer, ListWorkflowsUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "./ListWebsiteBuilderPageWorkflowsUseCase.js";

export const ListWebsiteBuilderPageWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageWorkflows",
    register(container) {
        container.register(ListWebsiteBuilderPageWorkflowsUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageWorkflows/index.ts`:

```ts
export { ListWebsiteBuilderPageWorkflowsUseCase } from "./abstractions.js";
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";

export interface GetWebsiteBuilderPageWorkflowInput {
    id: string;
}

export interface IGetWebsiteBuilderPageWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    get: GetWorkflowUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageWorkflowUseCaseErrors[keyof IGetWebsiteBuilderPageWorkflowUseCaseErrors];

export interface IGetWebsiteBuilderPageWorkflowUseCase {
    execute(input: GetWebsiteBuilderPageWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** One pages workflow, for any signed-in identity (D78); another app's is not found (R46). */
export const GetWebsiteBuilderPageWorkflowUseCase =
    createAbstraction<IGetWebsiteBuilderPageWorkflowUseCase>(
        "GetWebsiteBuilderPageWorkflowUseCase"
    );

export namespace GetWebsiteBuilderPageWorkflowUseCase {
    export type Interface = IGetWebsiteBuilderPageWorkflowUseCase;
    export type Input = GetWebsiteBuilderPageWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/GetWebsiteBuilderPageWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { GetWebsiteBuilderPageWorkflowUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const workflow = await this.getWorkflow.execute({ id: input.id });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        if (!isWbWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }
        return Result.ok(workflow.value);
    }
}

export const GetWebsiteBuilderPageWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageWorkflowUseCaseImpl,
    dependencies: [CurrentReviewViewer, GetWorkflowUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageWorkflowUseCase } from "./GetWebsiteBuilderPageWorkflowUseCase.js";

export const GetWebsiteBuilderPageWorkflowFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageWorkflow",
    register(container) {
        container.register(GetWebsiteBuilderPageWorkflowUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageWorkflow/index.ts`:

```ts
export { GetWebsiteBuilderPageWorkflowUseCase } from "./abstractions.js";
export type { GetWebsiteBuilderPageWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 7: Register**

Create `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreWebsiteBuilderPageWorkflowFeature } from "./StoreWebsiteBuilderPageWorkflow/feature.js";
import { DeleteWebsiteBuilderPageWorkflowFeature } from "./DeleteWebsiteBuilderPageWorkflow/feature.js";
import { ListWebsiteBuilderPageWorkflowsFeature } from "./ListWebsiteBuilderPageWorkflows/feature.js";
import { GetWebsiteBuilderPageWorkflowFeature } from "./GetWebsiteBuilderPageWorkflow/feature.js";

/**
 * The Website Builder wrapper use cases (D132, D133, R45): identity, `workflows` permission and page
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
 */
export const WbWrappersFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Wrappers",
    register(container) {
        // Workflows
        StoreWebsiteBuilderPageWorkflowFeature.register(container);
        DeleteWebsiteBuilderPageWorkflowFeature.register(container);
        ListWebsiteBuilderPageWorkflowsFeature.register(container);
        GetWebsiteBuilderPageWorkflowFeature.register(container);
    }
});
```

In `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts` import `WbWrappersFeature` from `./features/wrappers/feature.js` and add after `WbHooksFeature.register(container);`:

```ts
        WbWrappersFeature.register(container);
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`), then commit:

```
feat(api-website-builder-workflows): add the page workflow store, delete, list and get wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
