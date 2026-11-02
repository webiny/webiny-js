### Task 12: CMS workflow store, delete, list and get wrappers

Spec 4.1, 8, D78, D115, D131, D132, D133, R45, R46, R57-R60, R76, R78, R80. Four wrappers over the engine's workflow use cases for `cms.*` workflows, built on the shared building blocks of Task 6b:

- `StoreCmsEntryWorkflowUseCase`: `editor`; models must be `cms.*`; never stores over another app's workflow; passes `savedOn` and the actor.
- `DeleteCmsEntryWorkflowUseCase`: `editor`; another app's workflow is not found; on `HasActiveReviews` keeps the first 5 blocking reviews the caller can read (checking at most 50, a failed read counts as unreadable), with the exact count (D115, R76).
- `ListCmsEntryWorkflowsUseCase`, `GetCmsEntryWorkflowUseCase`: any authenticated identity; `cms.*` workflows only.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/shared/cmsWorkflows.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/StoreCmsEntryWorkflowUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/DeleteCmsEntryWorkflowUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/ListCmsEntryWorkflowsUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/GetCmsEntryWorkflowUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeListUserTeams.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/userContext.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingEventPublisher.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts`

**Interfaces:**
- Consumes: `CurrentReviewViewer` (`getActor()`), `WorkflowsPermissions` (`canEdit()`), `GetWorkflowUseCase`, `ListWorkflowsUseCase`, `StoreWorkflowUseCase` (Task 2), `DeleteWorkflowUseCase` (Tasks 2, 3), `ReadableBlockingReviewsService` (`MAX_BLOCKING_REVIEWS`, `MAX_BLOCKING_REVIEW_CHECKS`), `belongsToApp`, `isAppWorkflow` (Task 6b), `CmsEntryTargetReader`, `CmsEntryAccess` (Task 7), errors from `@webiny/api-workflows/domain/{permissions,workflow}/errors.js`, `EventPublisher` (test).
- Produces:
  - `shared/cmsWorkflows.ts`: `belongsToCms(models: string[]): boolean`, `isCmsWorkflow(workflow: WorkflowValues): boolean` (the Task 6b helpers with `isCmsNamespace`), `CMS_MODELS_ONLY` message.
  - `StoreCmsEntryWorkflowUseCase.Interface.execute(input: StoreCmsEntryWorkflowInput): Promise<Result<Workflow, Error>>`, `StoreCmsEntryWorkflowInput { workflow: WorkflowValues; savedOn?: string | null }`.
  - `DeleteCmsEntryWorkflowUseCase.Interface.execute(input: DeleteCmsEntryWorkflowInput): Promise<Result<Workflow, Error>>`, `DeleteCmsEntryWorkflowInput { id: string }`.
  - `ListCmsEntryWorkflowsUseCase.Interface.execute(): Promise<Result<Workflow[], Error>>`.
  - `GetCmsEntryWorkflowUseCase.Interface.execute(input: GetCmsEntryWorkflowInput): Promise<Result<Workflow, Error>>`, `GetCmsEntryWorkflowInput { id: string }`.
  - `CmsWrappersFeature` (registered by `CmsWorkflowsFeature`); Tasks 13 and 14 add to it.
  - Test helpers `FakeListUserTeams`, `createUserContext({ identity, permissions, legacyPlugins })`, `RecordingEventPublisher` + `recordedEvents` (a copy of the api-workflows helper without its call log).

- [ ] **Step 1: Write the test helpers and the failing test**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeListUserTeams.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { Team } from "@webiny/api-core/types/security.js";

const createTeam = (id: string): Team => {
    return {
        id,
        name: id,
        slug: id,
        description: "",
        system: false,
        roles: [],
        createdOn: null,
        createdBy: null
    };
};

/** Team lookups from a fixed map of user id → team ids; unknown users have no teams. */
export class FakeListUserTeams implements ListUserTeamsUseCase.Interface {
    public constructor(private teamsByUser: Record<string, string[]>) {}

    public async execute(userId: string): Promise<Result<Team[], ListUserTeamsUseCase.Error>> {
        return Result.ok((this.teamsByUser[userId] ?? []).map(createTeam));
    }
}
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/userContext.ts`:

```ts
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { OTHER_REVIEWER, REVIEW_TEAM, REVIEWER } from "./identities.js";

/** Both reviewers are in the test step's team; nobody else is in any team. */
const TEAMS: Record<string, string[]> = {
    [REVIEWER.id]: [REVIEW_TEAM],
    [OTHER_REVIEWER.id]: [REVIEW_TEAM]
};

export interface UserContextParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    legacyPlugins?: unknown[];
}

/**
 * A request context as the given identity, with fixed teams and the fake FLP (A28). Data persists
 * across contexts within one test (A32), so tests set up as the admin and act as another user.
 */
export const createUserContext = async (params: UserContextParams = {}): Promise<CmsContext> => {
    const { context } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEAMS));
                container.register(FakeFolderLevelPermissions);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
    return (await context()) as CmsContext;
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingEventPublisher.ts`:

```ts
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";

/** Every event published while the decorator is registered. Reset it at the start of a test. */
export const recordedEvents: DomainEvent<any>[] = [];

class RecordingEventPublisherImpl implements EventPublisher.Interface {
    constructor(private decoratee: EventPublisher.Interface) {}

    async publish<TEvent extends DomainEvent<any>>(event: TEvent): Promise<void> {
        recordedEvents.push(event);
        await this.decoratee.publish(event);
    }
}

export const RecordingEventPublisher = EventPublisher.createDecorator({
    decorator: RecordingEventPublisherImpl,
    dependencies: []
});
```

Create `packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowHasActiveReviewsErrorData } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { EDITOR, READER, toActor } from "~tests/__helpers/identities.js";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { CMS_READER, WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";

/** A workflow editor who can read CMS models (binding needs model read access, R38). */
const createEditorContext = () => {
    return createUserContext({ identity: EDITOR, permissions: [WORKFLOWS_EDITOR, ...CMS_READER] });
};

/** As `createEditorContext`, recording every published event (R80). */
const createRecordingEditorContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: EDITOR,
        permissions: [WORKFLOWS_EDITOR, ...CMS_READER],
        legacyPlugins: [
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

/** The `actor` of each recorded workflow event, by event type (R58, R80). */
const workflowEventActors = () => {
    return recordedEvents
        .filter(event => event.eventType.startsWith("Workflows/Workflow/"))
        .map(event => [event.eventType, event.payload.actor]);
};

const createReaderContext = () => {
    return createUserContext({ identity: READER, permissions: CMS_READER });
};

const store = (context: CmsContext, workflow = createWorkflowValues(), savedOn?: string) => {
    return context.container
        .resolve(StoreCmsEntryWorkflowUseCase)
        .execute({ workflow, savedOn });
};

const remove = (context: CmsContext, id: string) => {
    return context.container.resolve(DeleteCmsEntryWorkflowUseCase).execute({ id });
};

/** A Website Builder workflow stored through the engine (no wrapper). */
const storeWbWorkflow = async (context: CmsContext) => {
    return expectOk(
        await storeWorkflow(context, {
            ...createWorkflowValues(["wb.page"]),
            id: "wb-workflow",
            name: "Pages review"
        })
    );
};

describe("CMS workflow wrappers", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("stores a workflow for an editor and passes savedOn through (D131)", async () => {
        const editor = await createEditorContext();

        const created = expectOk(await store(editor));
        const stale = await store(
            editor,
            { ...createWorkflowValues(), name: "Changed" },
            "2000-01-01T00:00:00.000Z"
        );
        const updated = await store(
            editor,
            { ...createWorkflowValues(), name: "Changed" },
            created.savedOn
        );

        expect(created.savedBy.id).toBe(EDITOR.id);
        expect(stale.error.code).toBe("Workflows/Workflow/Conflict");
        expect(updated.isOk()).toBe(true);
    });

    it("passes the caller as the actor of the store and delete events (R58, R80)", async () => {
        const editor = await createRecordingEditorContext();

        const created = expectOk(await store(editor));
        expectOk(
            await store(editor, { ...createWorkflowValues(), name: "Changed" }, created.savedOn)
        );
        expectOk(await remove(editor, created.id));

        const actor = toActor(EDITOR);
        expect(workflowEventActors()).toEqual([
            ["Workflows/Workflow/BeforeCreate", actor],
            ["Workflows/Workflow/AfterCreate", actor],
            ["Workflows/Workflow/BeforeUpdate", actor],
            ["Workflows/Workflow/AfterUpdate", actor],
            ["Workflows/Workflow/BeforeDelete", actor],
            ["Workflows/Workflow/AfterDelete", actor]
        ]);
    });

    it("refuses to store or delete a workflow without editor (R60)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const reader = await createReaderContext();

        const stored = await store(reader);
        const deleted = await remove(reader, "workflow-1");

        expect(stored.error.code).toBe("Workflows/NotAuthorized");
        expect(stored.error.data).toEqual({ action: "manage workflows" });
        expect(deleted.error.code).toBe("Workflows/NotAuthorized");
    });

    it("refuses an anonymous identity", async () => {
        const anonymous = await createUserContext({ identity: null, permissions: [] });

        const stored = await store(anonymous);
        const listed = await anonymous.container.resolve(ListCmsEntryWorkflowsUseCase).execute();

        expect(stored.error.code).toBe("Workflows/NotAuthenticated");
        expect(listed.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("binds Headless CMS workflows to Headless CMS models only (R46)", async () => {
        const editor = await createEditorContext();

        const result = await store(editor, createWorkflowValues(["wb.page"]));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'A Headless CMS workflow can only be bound to Headless CMS models ("cms.<modelId>").'
        );
    });

    it("does not rebind a Website Builder workflow (R46)", async () => {
        await storeWbWorkflow(await createUserContext());
        const editor = await createEditorContext();

        const result = await store(editor, { ...createWorkflowValues(), id: "wb-workflow" });

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("lists and gets Headless CMS workflows only", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        await storeWbWorkflow(admin);
        const reader = await createReaderContext();

        const listed = expectOk(
            await reader.container.resolve(ListCmsEntryWorkflowsUseCase).execute()
        );
        const cms = await reader.container
            .resolve(GetCmsEntryWorkflowUseCase)
            .execute({ id: "workflow-1" });
        const wb = await reader.container
            .resolve(GetCmsEntryWorkflowUseCase)
            .execute({ id: "wb-workflow" });

        expect(listed.map(workflow => workflow.id)).toEqual(["workflow-1"]);
        expect(cms.isOk()).toBe(true);
        expect(wb.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("deletes a workflow for an editor and not another app's", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        await storeWbWorkflow(admin);
        const editor = await createEditorContext();

        const deleted = await remove(editor, "workflow-1");
        const wb = await remove(editor, "wb-workflow");

        expect(deleted.isOk()).toBe(true);
        expect(wb.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("lists at most five readable blocking reviews and keeps the exact count (D115)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        // Locked and readable entries interleaved, so the result does not depend on list order.
        const lockedRevisionIds: string[] = [];
        for (let i = 1; i <= 6; i++) {
            const locked = await createAuthorEntry(admin, {
                name: `Locked ${i}`,
                folderId: "folder-locked"
            });
            lockedRevisionIds.push(locked.id);
            await requestEntryReview(admin, locked);
            await requestEntryReview(admin, await createAuthorEntry(admin, { name: `Open ${i}` }));
        }
        folderLevels.set("folder-locked", new Map([[EDITOR.id, "no-access"]]));
        const editor = await createEditorContext();

        const blocked = await remove(editor, "workflow-1");

        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        const data = blocked.error.data as WorkflowHasActiveReviewsErrorData;
        expect(data.count).toBe(12);
        expect(data.reviews).toHaveLength(5);
        expect(data.reviews.some(review => lockedRevisionIds.includes(review.targetRevisionId))).toBe(
            false
        );
        expect(data.reviews[0].stepName).toBe("Step 1");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/StoreCmsEntryWorkflow/index.js`.

- [ ] **Step 3: Shared helpers**

Create `packages/api-headless-cms-workflows/src/features/wrappers/shared/cmsWorkflows.ts`:

```ts
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { belongsToApp, isAppWorkflow } from "@webiny/api-workflows/domain/workflow/isAppWorkflow.js";
import { isCmsNamespace } from "~/utils/appName.js";

export const CMS_MODELS_ONLY =
    'A Headless CMS workflow can only be bound to Headless CMS models ("cms.<modelId>").';

/** Every model is a `cms.<modelId>` namespace; an empty list is left to the engine's validation. */
export const belongsToCms = (models: string[]): boolean => {
    return belongsToApp(models, isCmsNamespace);
};

/** A stored workflow of the Headless CMS app (R46). */
export const isCmsWorkflow = (workflow: WorkflowValues): boolean => {
    return isAppWorkflow(workflow, isCmsNamespace);
};
```

- [ ] **Step 4: StoreCmsEntryWorkflow**

Create `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow, WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";

export interface StoreCmsEntryWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the editor loaded; omit when creating (D131). */
    savedOn?: string | null;
}

export interface IStoreCmsEntryWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    store: StoreWorkflowUseCase.Error;
}

type UseCaseError = IStoreCmsEntryWorkflowUseCaseErrors[keyof IStoreCmsEntryWorkflowUseCaseErrors];

export interface IStoreCmsEntryWorkflowUseCase {
    execute(input: StoreCmsEntryWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update a Headless CMS workflow (spec 4.1, D131, D132): needs `workflows.editor`;
 * models must be `cms.<modelId>`; a workflow of another app is never overwritten (R46, R60).
 */
export const StoreCmsEntryWorkflowUseCase = createAbstraction<IStoreCmsEntryWorkflowUseCase>(
    "StoreCmsEntryWorkflowUseCase"
);

export namespace StoreCmsEntryWorkflowUseCase {
    export type Interface = IStoreCmsEntryWorkflowUseCase;
    export type Input = StoreCmsEntryWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/StoreCmsEntryWorkflowUseCase.ts`:

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
import { belongsToCms, CMS_MODELS_ONLY, isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { StoreCmsEntryWorkflowUseCase as UseCase } from "./abstractions.js";

class StoreCmsEntryWorkflowUseCaseImpl implements UseCase.Interface {
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
        if (!belongsToCms(input.workflow.models)) {
            return Result.fail(new WorkflowValidationError(CMS_MODELS_ONLY));
        }

        // Never overwrite another app's workflow under the same id (R46).
        const existing = await this.getWorkflow.execute({ id: input.workflow.id });
        if (existing.isFail() && !(existing.error instanceof WorkflowNotFoundError)) {
            return Result.fail(existing.error);
        }
        if (existing.isOk() && !isCmsWorkflow(existing.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflow.id }));
        }

        return this.storeWorkflow.execute({
            workflow: input.workflow,
            savedOn: input.savedOn,
            actor: actor.value
        });
    }
}

export const StoreCmsEntryWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreCmsEntryWorkflowUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, GetWorkflowUseCase, StoreWorkflowUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreCmsEntryWorkflowUseCase } from "./StoreCmsEntryWorkflowUseCase.js";

export const StoreCmsEntryWorkflowFeature = createFeature({
    name: "CmsWorkflows/StoreCmsEntryWorkflow",
    register(container) {
        container.register(StoreCmsEntryWorkflowUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/StoreCmsEntryWorkflow/index.ts`:

```ts
export { StoreCmsEntryWorkflowUseCase } from "./abstractions.js";
export type { StoreCmsEntryWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 5: DeleteCmsEntryWorkflow**

Create `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import type { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";

export interface DeleteCmsEntryWorkflowInput {
    id: string;
}

export interface IDeleteCmsEntryWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    get: GetWorkflowUseCase.Error;
    delete: DeleteWorkflowUseCase.Error;
}

type UseCaseError =
    IDeleteCmsEntryWorkflowUseCaseErrors[keyof IDeleteCmsEntryWorkflowUseCaseErrors];

export interface IDeleteCmsEntryWorkflowUseCase {
    execute(input: DeleteCmsEntryWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Delete a Headless CMS workflow (spec 4.1, D132): needs `workflows.editor`. When reviews are in
 * progress, the error keeps the exact count and lists up to 5 the caller can read (D115, R57).
 */
export const DeleteCmsEntryWorkflowUseCase = createAbstraction<IDeleteCmsEntryWorkflowUseCase>(
    "DeleteCmsEntryWorkflowUseCase"
);

export namespace DeleteCmsEntryWorkflowUseCase {
    export type Interface = IDeleteCmsEntryWorkflowUseCase;
    export type Input = DeleteCmsEntryWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/DeleteCmsEntryWorkflowUseCase.ts`:

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
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { DeleteCmsEntryWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteCmsEntryWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private deleteWorkflow: DeleteWorkflowUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
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
        if (!isCmsWorkflow(existing.value)) {
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

export const DeleteCmsEntryWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteCmsEntryWorkflowUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        GetWorkflowUseCase,
        DeleteWorkflowUseCase,
        CmsEntryTargetReader,
        CmsEntryAccess,
        ReadableBlockingReviewsService
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DeleteCmsEntryWorkflowUseCase } from "./DeleteCmsEntryWorkflowUseCase.js";

export const DeleteCmsEntryWorkflowFeature = createFeature({
    name: "CmsWorkflows/DeleteCmsEntryWorkflow",
    register(container) {
        container.register(DeleteCmsEntryWorkflowUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/DeleteCmsEntryWorkflow/index.ts`:

```ts
export { DeleteCmsEntryWorkflowUseCase } from "./abstractions.js";
export type { DeleteCmsEntryWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 6: ListCmsEntryWorkflows and GetCmsEntryWorkflow**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface IListCmsEntryWorkflowsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListCmsEntryWorkflowsUseCaseErrors[keyof IListCmsEntryWorkflowsUseCaseErrors];

export interface IListCmsEntryWorkflowsUseCase {
    execute(): Promise<Result<Workflow[], UseCaseError>>;
}

/**
 * Every Headless CMS workflow, for any signed-in identity (D78). No paging in phase 2: v1 binds one
 * model per workflow, so the list is at most the model count (R59, A23).
 */
export const ListCmsEntryWorkflowsUseCase = createAbstraction<IListCmsEntryWorkflowsUseCase>(
    "ListCmsEntryWorkflowsUseCase"
);

export namespace ListCmsEntryWorkflowsUseCase {
    export type Interface = IListCmsEntryWorkflowsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow[], UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/ListCmsEntryWorkflowsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { ListCmsEntryWorkflowsUseCase as UseCase } from "./abstractions.js";

const PAGE_SIZE = 100;

/**
 * The CMS where-filters cannot express "every `cms.*` model", so this pages through every
 * workflow and keeps the Headless CMS ones (R59).
 */
class ListCmsEntryWorkflowsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listWorkflows: ListWorkflowsUseCase.Interface
    ) {}

    public async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const workflows: Workflow[] = [];
        let after: string | null = null;
        do {
            const page: Awaited<ListWorkflowsUseCase.Return> = await this.listWorkflows.execute({
                limit: PAGE_SIZE,
                after
            });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            workflows.push(...page.value.items.filter(isCmsWorkflow));
            after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
        } while (after);

        return Result.ok(workflows);
    }
}

export const ListCmsEntryWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryWorkflowsUseCaseImpl,
    dependencies: [CurrentReviewViewer, ListWorkflowsUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryWorkflowsUseCase } from "./ListCmsEntryWorkflowsUseCase.js";

export const ListCmsEntryWorkflowsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryWorkflows",
    register(container) {
        container.register(ListCmsEntryWorkflowsUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflows/index.ts`:

```ts
export { ListCmsEntryWorkflowsUseCase } from "./abstractions.js";
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";

export interface GetCmsEntryWorkflowInput {
    id: string;
}

export interface IGetCmsEntryWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    get: GetWorkflowUseCase.Error;
}

type UseCaseError = IGetCmsEntryWorkflowUseCaseErrors[keyof IGetCmsEntryWorkflowUseCaseErrors];

export interface IGetCmsEntryWorkflowUseCase {
    execute(input: GetCmsEntryWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** One Headless CMS workflow, for any signed-in identity (D78); another app's is not found (R46). */
export const GetCmsEntryWorkflowUseCase = createAbstraction<IGetCmsEntryWorkflowUseCase>(
    "GetCmsEntryWorkflowUseCase"
);

export namespace GetCmsEntryWorkflowUseCase {
    export type Interface = IGetCmsEntryWorkflowUseCase;
    export type Input = GetCmsEntryWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/GetCmsEntryWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { GetCmsEntryWorkflowUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryWorkflowUseCaseImpl implements UseCase.Interface {
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
        if (!isCmsWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }
        return Result.ok(workflow.value);
    }
}

export const GetCmsEntryWorkflowUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryWorkflowUseCaseImpl,
    dependencies: [CurrentReviewViewer, GetWorkflowUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryWorkflowUseCase } from "./GetCmsEntryWorkflowUseCase.js";

export const GetCmsEntryWorkflowFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryWorkflow",
    register(container) {
        container.register(GetCmsEntryWorkflowUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryWorkflow/index.ts`:

```ts
export { GetCmsEntryWorkflowUseCase } from "./abstractions.js";
export type { GetCmsEntryWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 7: Register**

Create `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreCmsEntryWorkflowFeature } from "./StoreCmsEntryWorkflow/feature.js";
import { DeleteCmsEntryWorkflowFeature } from "./DeleteCmsEntryWorkflow/feature.js";
import { ListCmsEntryWorkflowsFeature } from "./ListCmsEntryWorkflows/feature.js";
import { GetCmsEntryWorkflowFeature } from "./GetCmsEntryWorkflow/feature.js";

/**
 * The Headless CMS wrapper use cases (D132, D133, R45): identity, `workflows` permission and target
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
 */
export const CmsWrappersFeature = createFeature({
    name: "CmsWorkflows/Wrappers",
    register(container) {
        // Workflows
        StoreCmsEntryWorkflowFeature.register(container);
        DeleteCmsEntryWorkflowFeature.register(container);
        ListCmsEntryWorkflowsFeature.register(container);
        GetCmsEntryWorkflowFeature.register(container);
    }
});
```

In `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts` import `CmsWrappersFeature` from `./features/wrappers/feature.js` and register it after `CmsHooksFeature.register(container);`:

```ts
        // Wrapper use cases (identity, permission and target checks around the engine).
        CmsWrappersFeature.register(container);
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): add the cms workflow store, delete, list and get wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
