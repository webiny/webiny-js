### Task 3: Replace the workflow model, repository, use cases and events

**Files:**
- Delete: `packages/api-workflows/src/domain/workflow/WorkflowMapper.ts`, `packages/api-workflows/src/domain/workflow/abstractions.ts`, `packages/api-workflows/src/domain/workflow/workflowModel.ts`, `packages/api-workflows/src/features/workflow/` (all six old folders), `packages/api-workflows/src/features/shared/abstractions.ts`, `packages/api-workflows/src/features/WorkflowModelProviders.ts`, `packages/api-workflows/__tests__/WorkflowMapper.test.ts`, `packages/api-workflows/__tests__/WorkflowUseCases.test.ts`, `packages/api-workflows/__tests__/mocks/`
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts` (rewrite), `packages/api-workflows/src/WorkflowsFeature.ts`, `packages/api-workflows/__tests__/registration.test.ts`
- Create: `packages/api-workflows/src/domain/workflow/workflow.model.ts`
- Create: `packages/api-workflows/src/domain/workflow/abstractions/WorkflowModelProvider.ts`
- Create: `packages/api-workflows/src/domain/workflow/abstractions/WorkflowRepository.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/WorkflowEntryMapper.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/WorkflowModelProvider.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/WorkflowRepository.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/feature.ts`
- Create: `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts` (create and update Before/After events)
- Create: `packages/api-workflows/src/features/workflow/DeleteWorkflow/events.ts` (delete Before/After events)
- Create: `packages/api-workflows/src/features/workflow/GetWorkflow/{abstractions.ts,GetWorkflowUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/workflow/ListWorkflows/{abstractions.ts,ListWorkflowsUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/workflow/StoreWorkflow/{abstractions.ts,StoreWorkflowUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/workflow/DeleteWorkflow/{abstractions.ts,DeleteWorkflowUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingEventPublisher.ts`
- Create: `packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`
- Modify (CMS): `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`, `packages/api-headless-cms-workflows/src/features/Workflows/feature.ts`, `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts`, `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`, `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create (CMS): `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsBindable.ts`, `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts`

**Interfaces:**
- Consumes: `WorkflowValidator`, workflow types (Task 2); CMS `CreateEntryUseCase`, `UpdateEntryUseCase`, `GetEntryByIdUseCase`, `ListLatestEntriesUseCase`, `DeleteEntryUseCase` (`@webiny/api-headless-cms/features/contentEntry/{CreateEntry,UpdateEntry,GetEntryById,ListEntries,DeleteEntry}/index.js`), `GetModelUseCase`, `ModelFactory`, `EventPublisher`, `DomainEvent`, `IEventHandler`, `createIdentifier` / `parseIdentifier` (`@webiny/utils`), `CmsEntry`, `CmsEntryMeta`, `CmsIdentity`, `CmsModel` (`@webiny/api-headless-cms/types/index.js`).
- Produces:
  - Errors: `WorkflowNotFoundError` (`Workflows/Workflow/NotFound`, data `{ id }`), `WorkflowConflictError` (`Workflows/Workflow/Conflict`, data `{ savedOn, savedBy }`), `WorkflowValidationError` (`Workflows/Workflow/Validation`), `isWorkflowValidationError(error: unknown): error is WorkflowValidationError`, `WorkflowPersistenceError` (`Workflows/Workflow/Persistence`).
  - `WorkflowModelProvider.Interface { get(): Promise<CmsModel> }`.
  - `WorkflowRepository.Interface { get(id); list(params: WorkflowRepository.ListParams); create(values: WorkflowValues); update(values: WorkflowValues); delete(id) }`.
  - Use cases: `GetWorkflowUseCase.execute({ id })`, `ListWorkflowsUseCase.execute({ where?: { models_in? }, limit?, after? })` → `{ items: Workflow[]; meta: CmsEntryMeta }`, `StoreWorkflowUseCase.execute({ workflow: WorkflowValues; savedOn?: string | null })`, `DeleteWorkflowUseCase.execute({ id })`; all return `Result<…>`.
  - Events, one `events.ts` per use case folder (repo convention, e.g. CMS `CreateEntry/events.ts`): `StoreWorkflow/events.ts` holds `WorkflowBeforeCreateEvent` / `WorkflowAfterCreateEvent` / `WorkflowBeforeUpdateEvent` / `WorkflowAfterUpdateEvent`; `DeleteWorkflow/events.ts` holds `WorkflowBeforeDeleteEvent` / `WorkflowAfterDeleteEvent`; each with its `…EventHandler` abstraction. The handler abstractions and payload types are exported from the use case's `index.ts` (`@webiny/api-workflows/features/workflow/StoreWorkflow/index.js`, `…/DeleteWorkflow/index.js`), as CMS `CreateEntry/index.ts` does. Workflow events carry no actor in 1a (1b adds it).
  - CMS: `assertModelsBindable(getModel, models): Promise<void>` (throws `WorkflowValidationError` when a `cms.*` model does not exist or is unpublishable); handlers `DisallowUnpublishableModelsOnBeforeCreate`, `DisallowUnpublishableModelsOnBeforeUpdate`.

- [ ] **Step 1: Write the event recorder used by tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingEventPublisher.ts`:

```ts
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";

/** Every event published while the decorator is registered. Reset it at the start of a test. */
export const recordedEvents: DomainEvent<any>[] = [];

/** Event types published by workflows, in order. */
export const workflowEventTypes = (): string[] => {
    return recordedEvents
        .map(event => event.eventType)
        .filter(eventType => eventType.startsWith("Workflows/"));
};

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

- [ ] **Step 2: Write the failing tests**

Create `packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, createWorkflowValues } from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const STALE_SAVED_ON = "2000-01-01T00:00:00.000Z";

const createUseCases = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });

    return {
        storeWorkflow: context.container.resolve(StoreWorkflowUseCase),
        getWorkflow: context.container.resolve(GetWorkflowUseCase),
        listWorkflows: context.container.resolve(ListWorkflowsUseCase),
        deleteWorkflow: context.container.resolve(DeleteWorkflowUseCase)
    };
};

describe("Workflow use cases", () => {
    it("creates, reads, lists, updates and deletes a workflow", async () => {
        const { storeWorkflow, getWorkflow, listWorkflows, deleteWorkflow } =
            await createUseCases();
        const values = createWorkflowValues();

        const created = await storeWorkflow.execute({ workflow: values });
        expect(created.isOk()).toBe(true);
        expect(created.value).toMatchObject(values);
        expect(created.value.savedOn).toEqual(expect.any(String));
        expect(created.value.savedBy.id).toEqual(expect.any(String));

        const read = await getWorkflow.execute({ id: values.id });
        expect(read.value).toEqual(created.value);

        const listed = await listWorkflows.execute({ where: { models_in: [ARTICLE_MODEL] } });
        expect(listed.value.items.map(item => item.id)).toEqual([values.id]);

        const otherModel = await listWorkflows.execute({ where: { models_in: ["cms.other"] } });
        expect(otherModel.value.items).toEqual([]);

        const updated = await storeWorkflow.execute({
            workflow: { ...values, name: "Article review v2" },
            savedOn: created.value.savedOn
        });
        expect(updated.isOk()).toBe(true);
        expect(updated.value.name).toBe("Article review v2");

        const deleted = await deleteWorkflow.execute({ id: values.id });
        expect(deleted.isOk()).toBe(true);

        const afterDelete = await getWorkflow.execute({ id: values.id });
        expect(afterDelete.isFail()).toBe(true);
        expect(afterDelete.error.code).toBe("Workflows/Workflow/NotFound");

        expect(workflowEventTypes()).toEqual([
            "Workflows/Workflow/BeforeCreate",
            "Workflows/Workflow/AfterCreate",
            "Workflows/Workflow/BeforeUpdate",
            "Workflows/Workflow/AfterUpdate",
            "Workflows/Workflow/BeforeDelete",
            "Workflows/Workflow/AfterDelete"
        ]);
    });

    it("validates through the same path on create and update", async () => {
        const { storeWorkflow } = await createUseCases();

        const invalidCreate = await storeWorkflow.execute({
            workflow: createWorkflowValues({ steps: [] })
        });
        expect(invalidCreate.isFail()).toBe(true);
        expect(invalidCreate.error.code).toBe("Workflows/Workflow/Validation");
        expect(invalidCreate.error.message).toBe("Add at least one step.");

        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });
        const invalidUpdate = await storeWorkflow.execute({
            workflow: createWorkflowValues({ steps: [] }),
            savedOn: created.value.savedOn
        });
        expect(invalidUpdate.isFail()).toBe(true);
        expect(invalidUpdate.error.message).toBe("Add at least one step.");
        expect(workflowEventTypes()).toEqual([
            "Workflows/Workflow/BeforeCreate",
            "Workflows/Workflow/AfterCreate"
        ]);
    });

    it("rejects a save with a stale savedOn", async () => {
        const { storeWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ name: "Changed" }),
            savedOn: STALE_SAVED_ON
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: created.value.savedOn,
            savedBy: created.value.savedBy
        });
    });

    it("rejects creating a workflow over an existing one", async () => {
        const { storeWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: created.value.savedOn,
            savedBy: created.value.savedBy
        });
    });

    it("does not recreate a workflow deleted while it was being edited", async () => {
        const { storeWorkflow, deleteWorkflow, getWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });
        await deleteWorkflow.execute({ id: created.value.id });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ name: "Changed" }),
            savedOn: created.value.savedOn
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        expect(result.error.data).toEqual({ id: created.value.id });
        const read = await getWorkflow.execute({ id: created.value.id });
        expect(read.isFail()).toBe(true);
    });

    it("allows one workflow per model", async () => {
        const { storeWorkflow } = await createUseCases();
        await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ id: "workflow-2", name: "Second review" })
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'The model "cms.article" already has a workflow: "Article review".'
        );
    });

    it("returns NotFound for unknown workflows", async () => {
        const { getWorkflow, deleteWorkflow } = await createUseCases();

        const read = await getWorkflow.execute({ id: "missing" });
        expect(read.isFail()).toBe(true);
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");

        const deleted = await deleteWorkflow.execute({ id: "missing" });
        expect(deleted.isFail()).toBe(true);
        expect(deleted.error.code).toBe("Workflows/Workflow/NotFound");
    });
});
```

Replace `packages/api-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers the workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(DeleteWorkflowUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts 2>&1 | tail -50`
Expected: FAIL (the old use case cannot handle the new input shape; it expects `{ app, id, name, steps }`, so tests fail on an assertion or with a TypeError inside the old get/create path).

- [ ] **Step 4: Delete the old workflow code**

```bash
git rm -r -q packages/api-workflows/src/domain/workflow/WorkflowMapper.ts \
  packages/api-workflows/src/domain/workflow/abstractions.ts \
  packages/api-workflows/src/domain/workflow/workflowModel.ts \
  packages/api-workflows/src/features/workflow \
  packages/api-workflows/src/features/shared/abstractions.ts \
  packages/api-workflows/src/features/WorkflowModelProviders.ts \
  packages/api-workflows/__tests__/WorkflowMapper.test.ts \
  packages/api-workflows/__tests__/WorkflowUseCases.test.ts \
  packages/api-workflows/__tests__/mocks
```

- [ ] **Step 5: Rewrite the workflow errors**

Replace `packages/api-workflows/src/domain/workflow/errors.ts` with:

```ts
import { BaseError } from "@webiny/feature/api";
import type { WorkflowIdentity } from "./types.js";

export interface WorkflowNotFoundErrorData {
    id: string;
}

export class WorkflowNotFoundError extends BaseError<WorkflowNotFoundErrorData> {
    override readonly code = "Workflows/Workflow/NotFound" as const;

    constructor(data: WorkflowNotFoundErrorData) {
        super({
            message: `Workflow "${data.id}" was not found.`,
            data
        });
    }
}

export interface WorkflowConflictErrorData {
    savedOn: string;
    savedBy: WorkflowIdentity;
}

/** The stored workflow changed after the caller loaded it (D131). */
export class WorkflowConflictError extends BaseError<WorkflowConflictErrorData> {
    override readonly code = "Workflows/Workflow/Conflict" as const;

    constructor(data: WorkflowConflictErrorData) {
        super({
            message: `The workflow was changed by ${data.savedBy.displayName} on ${data.savedOn}. Reload it to see the latest version.`,
            data
        });
    }
}

export class WorkflowValidationError extends BaseError {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

/** Duck-typed so errors thrown by handlers in other packages are recognised. */
export const isWorkflowValidationError = (error: unknown): error is WorkflowValidationError => {
    return (
        error instanceof Error &&
        (error as Partial<WorkflowValidationError>).code === "Workflows/Workflow/Validation"
    );
};

export class WorkflowPersistenceError extends BaseError {
    override readonly code = "Workflows/Workflow/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
```

- [ ] **Step 6: Add the workflow model and its abstractions**

Create `packages/api-workflows/src/domain/workflow/workflow.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * Private model for workflows (spec 4.1). Validation lives in `WorkflowValidator`; the step
 * `config` is JSON so new step types need no model change.
 */
class WorkflowModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_MODEL_ID,
                    name: "Workflow"
                })
                .fields(fields => ({
                    name: fields.text().label("Name"),
                    models: fields.text().label("Models").list(),
                    steps: fields
                        .object()
                        .label("Steps")
                        .list()
                        .fields(stepFields => ({
                            id: stepFields.text().label("ID"),
                            title: stepFields.text().label("Title"),
                            color: stepFields.text().label("Color"),
                            description: stepFields.longText().label("Description"),
                            type: stepFields.text().label("Type"),
                            notifications: stepFields
                                .object()
                                .label("Notifications")
                                .list()
                                .fields(notificationFields => ({
                                    id: notificationFields.text().label("ID")
                                })),
                            config: stepFields.json().label("Config")
                        }))
                }))
        ];
    }
}

export const WorkflowModel = ModelFactory.createImplementation({
    implementation: WorkflowModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/workflow/abstractions/WorkflowModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowModelProvider {
    get(): Promise<CmsModel>;
}

/**
 * Provides the tenant's `wbyWorkflow` model. A provider rather than the model itself: fetching a
 * model is asynchronous and tenant-dependent, while DI resolution is synchronous.
 */
export const WorkflowModelProvider =
    createAbstraction<IWorkflowModelProvider>("WorkflowModelProvider");

export namespace WorkflowModelProvider {
    export type Interface = IWorkflowModelProvider;
}
```

Create `packages/api-workflows/src/domain/workflow/abstractions/WorkflowRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { Workflow, WorkflowValues } from "../types.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "../errors.js";

export interface WorkflowRepositoryListWhere {
    /** Workflows bound to any of these namespace ids. */
    models_in?: string[];
}

export interface WorkflowRepositoryListParams {
    where?: WorkflowRepositoryListWhere;
    limit?: number;
    after?: string | null;
}

export interface WorkflowRepositoryListResult {
    items: Workflow[];
    meta: CmsEntryMeta;
}

export interface IWorkflowRepository {
    get(id: string): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>>;
    list(
        params: WorkflowRepositoryListParams
    ): Promise<Result<WorkflowRepositoryListResult, WorkflowPersistenceError>>;
    create(values: WorkflowValues): Promise<Result<Workflow, WorkflowPersistenceError>>;
    update(
        values: WorkflowValues
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>>;
    delete(id: string): Promise<Result<void, WorkflowNotFoundError | WorkflowPersistenceError>>;
}

/** Reads and writes workflows (entries of the private `wbyWorkflow` model, always revision 1). */
export const WorkflowRepository = createAbstraction<IWorkflowRepository>("WorkflowRepository");

export namespace WorkflowRepository {
    export type Interface = IWorkflowRepository;
    export type ListParams = WorkflowRepositoryListParams;
    export type ListWhere = WorkflowRepositoryListWhere;
    export type ListResult = WorkflowRepositoryListResult;
}
```

- [ ] **Step 7: Add the shared workflow implementations**

Create `packages/api-workflows/src/features/workflow/shared/WorkflowEntryMapper.ts`:

```ts
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsIdentity } from "@webiny/api-headless-cms/types/index.js";
import type {
    Workflow,
    WorkflowIdentity,
    WorkflowStep,
    WorkflowStepNotification,
    WorkflowValues
} from "~/domain/workflow/types.js";

export interface WorkflowEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
}

export interface WorkflowEntryValues {
    name: string;
    models: string[] | null;
    steps: WorkflowEntryStep[] | null;
}

const toIdentity = (identity: CmsIdentity): WorkflowIdentity => {
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
};

/** Maps workflows to and from `wbyWorkflow` entries. */
export class WorkflowEntryMapper {
    public static toValues(values: WorkflowValues): WorkflowEntryValues {
        return {
            name: values.name,
            models: [...values.models],
            steps: values.steps.map(step => ({
                id: step.id,
                title: step.title,
                color: step.color,
                description: step.description ?? null,
                type: step.type,
                notifications: step.notifications.map(notification => ({ id: notification.id })),
                config: step.config
            }))
        };
    }

    public static fromEntry(entry: CmsEntry<WorkflowEntryValues>): Workflow {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            name: entry.values.name,
            models: entry.values.models ?? [],
            steps: (entry.values.steps ?? []).map(step => WorkflowEntryMapper.stepFromEntry(step)),
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            createdBy: toIdentity(entry.createdBy),
            savedBy: toIdentity(entry.savedBy)
        };
    }

    private static stepFromEntry(step: WorkflowEntryStep): WorkflowStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color ?? "",
            ...(step.description ? { description: step.description } : {}),
            type: step.type,
            notifications: (step.notifications ?? []).map(notification => ({
                id: notification.id
            })),
            config: step.config ?? null
        };
    }
}
```

Create `packages/api-workflows/src/features/workflow/shared/WorkflowModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider as Abstraction } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * No memoization (`ModelsFetcher` caches the model list per request) and no
 * `withoutAuthorization` (private models skip model authorization). Same as `FileModelProvider`
 * in api-file-manager.
 */
class WorkflowModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowModelProvider = Abstraction.createImplementation({
    implementation: WorkflowModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/workflow/shared/WorkflowRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { WorkflowRepository as Abstraction } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import { WorkflowEntryMapper, type WorkflowEntryValues } from "./WorkflowEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

class WorkflowRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: WorkflowModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async get(id: string): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<WorkflowEntryValues>(
            model,
            createIdentifier({ id, version: 1 })
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const where: CmsEntryListWhere | undefined = params.where?.models_in
            ? { values: { models_in: params.where.models_in } }
            : undefined;

        const result = await this.listLatestEntries.execute<WorkflowEntryValues>(model, {
            where,
            sort: ["createdOn_ASC"],
            limit: params.limit ?? 100,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new WorkflowPersistenceError(result.error));
        }

        return Result.ok({
            items: result.value.entries.map(entry => WorkflowEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
    }

    async create(values: WorkflowValues): Promise<Result<Workflow, WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<WorkflowEntryValues>(model, {
            id: values.id,
            values: WorkflowEntryMapper.toValues(values)
        });
        if (result.isFail()) {
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async update(
        values: WorkflowValues
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.updateEntry.execute<WorkflowEntryValues>(
            model,
            createIdentifier({ id: values.id, version: 1 }),
            { values: WorkflowEntryMapper.toValues(values) }
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id: values.id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async delete(id: string): Promise<Result<void, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.deleteEntry.execute(model, createIdentifier({ id, version: 1 }), {
            permanently: true
        });
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok();
    }
}

export const WorkflowRepository = Abstraction.createImplementation({
    implementation: WorkflowRepositoryImpl,
    dependencies: [
        WorkflowModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase
    ]
});
```

Create `packages/api-workflows/src/features/workflow/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowModelProvider } from "./WorkflowModelProvider.js";
import { WorkflowRepository } from "./WorkflowRepository.js";

export const WorkflowSharedFeature = createFeature({
    name: "Workflows/WorkflowShared",
    register(container) {
        container.register(WorkflowModelProvider);
        container.register(WorkflowRepository).inSingletonScope();
    }
});
```

- [ ] **Step 8: Add the workflow events**

One `events.ts` per use case folder, holding that use case's Before/After pairs (repo convention: old `CreateWorkflow/events.ts`, CMS `contentEntry/CreateEntry/events.ts`).

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";

/**
 * Event payloads. No actor in 1a: workflow use cases take no actor until phase 1b adds one.
 */
export interface WorkflowBeforeCreatePayload {
    workflow: WorkflowValues;
}

export interface WorkflowAfterCreatePayload {
    workflow: Workflow;
}

export interface WorkflowBeforeUpdatePayload {
    original: Workflow;
    workflow: WorkflowValues;
}

export interface WorkflowAfterUpdatePayload {
    original: Workflow;
    workflow: Workflow;
}

/**
 * WorkflowBeforeCreateEvent - published before a workflow is created.
 */
export class WorkflowBeforeCreateEvent extends DomainEvent<WorkflowBeforeCreatePayload> {
    eventType = "Workflows/Workflow/BeforeCreate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeCreateEventHandler;
    }
}

/** Hook in before a workflow is created. Throw `WorkflowValidationError` to reject the save. */
export const WorkflowBeforeCreateEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeCreateEvent>
>("WorkflowBeforeCreateEventHandler");

export namespace WorkflowBeforeCreateEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeCreateEvent>;
    export type Event = WorkflowBeforeCreateEvent;
}

/**
 * WorkflowAfterCreateEvent - published after a workflow is created.
 */
export class WorkflowAfterCreateEvent extends DomainEvent<WorkflowAfterCreatePayload> {
    eventType = "Workflows/Workflow/AfterCreate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterCreateEventHandler;
    }
}

/** Hook in after a workflow is created. */
export const WorkflowAfterCreateEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterCreateEvent>
>("WorkflowAfterCreateEventHandler");

export namespace WorkflowAfterCreateEventHandler {
    export type Interface = IEventHandler<WorkflowAfterCreateEvent>;
    export type Event = WorkflowAfterCreateEvent;
}

/**
 * WorkflowBeforeUpdateEvent - published before a workflow is updated.
 */
export class WorkflowBeforeUpdateEvent extends DomainEvent<WorkflowBeforeUpdatePayload> {
    eventType = "Workflows/Workflow/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeUpdateEventHandler;
    }
}

/** Hook in before a workflow is updated. Throw `WorkflowValidationError` to reject the save. */
export const WorkflowBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeUpdateEvent>
>("WorkflowBeforeUpdateEventHandler");

export namespace WorkflowBeforeUpdateEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeUpdateEvent>;
    export type Event = WorkflowBeforeUpdateEvent;
}

/**
 * WorkflowAfterUpdateEvent - published after a workflow is updated.
 */
export class WorkflowAfterUpdateEvent extends DomainEvent<WorkflowAfterUpdatePayload> {
    eventType = "Workflows/Workflow/AfterUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterUpdateEventHandler;
    }
}

/** Hook in after a workflow is updated. */
export const WorkflowAfterUpdateEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterUpdateEvent>
>("WorkflowAfterUpdateEventHandler");

export namespace WorkflowAfterUpdateEventHandler {
    export type Interface = IEventHandler<WorkflowAfterUpdateEvent>;
    export type Event = WorkflowAfterUpdateEvent;
}
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/events.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Workflow } from "~/domain/workflow/types.js";

/**
 * Event payloads. `workflow.savedBy` is the last editor, not the person deleting; phase 1b adds
 * an `actor` to the workflow events.
 */
export interface WorkflowBeforeDeletePayload {
    workflow: Workflow;
}

export interface WorkflowAfterDeletePayload {
    workflow: Workflow;
}

/**
 * WorkflowBeforeDeleteEvent - published before a workflow is deleted.
 */
export class WorkflowBeforeDeleteEvent extends DomainEvent<WorkflowBeforeDeletePayload> {
    eventType = "Workflows/Workflow/BeforeDelete" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeDeleteEventHandler;
    }
}

/** Hook in before a workflow is deleted. */
export const WorkflowBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeDeleteEvent>
>("WorkflowBeforeDeleteEventHandler");

export namespace WorkflowBeforeDeleteEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeDeleteEvent>;
    export type Event = WorkflowBeforeDeleteEvent;
}

/**
 * WorkflowAfterDeleteEvent - published after a workflow is deleted.
 */
export class WorkflowAfterDeleteEvent extends DomainEvent<WorkflowAfterDeletePayload> {
    eventType = "Workflows/Workflow/AfterDelete" as const;

    getHandlerAbstraction() {
        return WorkflowAfterDeleteEventHandler;
    }
}

/** Hook in after a workflow is deleted. */
export const WorkflowAfterDeleteEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterDeleteEvent>
>("WorkflowAfterDeleteEventHandler");

export namespace WorkflowAfterDeleteEventHandler {
    export type Interface = IEventHandler<WorkflowAfterDeleteEvent>;
    export type Event = WorkflowAfterDeleteEvent;
}
```

- [ ] **Step 9: Add `GetWorkflow`**

Create `packages/api-workflows/src/features/workflow/GetWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface GetWorkflowInput {
    id: string;
}

export interface IGetWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetWorkflowUseCaseErrors[keyof IGetWorkflowUseCaseErrors];

export interface IGetWorkflowUseCase {
    execute(input: GetWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Get one workflow by id. No permission check in 1a (phase 1b). */
export const GetWorkflowUseCase = createAbstraction<IGetWorkflowUseCase>("GetWorkflowUseCase");

export namespace GetWorkflowUseCase {
    export type Interface = IGetWorkflowUseCase;
    export type Input = GetWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/GetWorkflow/GetWorkflowUseCase.ts`:

```ts
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { GetWorkflowUseCase as UseCase } from "./abstractions.js";

class GetWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.get(input.id);
    }
}

export const GetWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository]
});
```

Create `packages/api-workflows/src/features/workflow/GetWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

export const GetWorkflowFeature = createFeature({
    name: "Workflows/GetWorkflow",
    register(container) {
        container.register(GetWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/GetWorkflow/index.ts`:

```ts
export { GetWorkflowUseCase } from "./abstractions.js";
export type { GetWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 10: Add `ListWorkflows`**

Create `packages/api-workflows/src/features/workflow/ListWorkflows/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface ListWorkflowsWhere {
    models_in?: string[];
}

export interface ListWorkflowsInput {
    where?: ListWorkflowsWhere;
    limit?: number;
    after?: string | null;
}

export interface ListWorkflowsResult {
    items: Workflow[];
    meta: CmsEntryMeta;
}

export interface IListWorkflowsUseCaseErrors {
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowsUseCaseErrors[keyof IListWorkflowsUseCaseErrors];

export interface IListWorkflowsUseCase {
    execute(input?: ListWorkflowsInput): Promise<Result<ListWorkflowsResult, UseCaseError>>;
}

/** List workflows, optionally by bound model. No permission check in 1a (phase 1b). */
export const ListWorkflowsUseCase =
    createAbstraction<IListWorkflowsUseCase>("ListWorkflowsUseCase");

export namespace ListWorkflowsUseCase {
    export type Interface = IListWorkflowsUseCase;
    export type Input = ListWorkflowsInput;
    export type Where = ListWorkflowsWhere;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListWorkflowsResult, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/ListWorkflows/ListWorkflowsUseCase.ts`:

```ts
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ListWorkflowsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowRepository.Interface) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        return this.repository.list({
            where: input.where,
            limit: input.limit,
            after: input.after
        });
    }
}

export const ListWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [WorkflowRepository]
});
```

Create `packages/api-workflows/src/features/workflow/ListWorkflows/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowsUseCase } from "./ListWorkflowsUseCase.js";

export const ListWorkflowsFeature = createFeature({
    name: "Workflows/ListWorkflows",
    register(container) {
        container.register(ListWorkflowsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/ListWorkflows/index.ts`:

```ts
export { ListWorkflowsUseCase } from "./abstractions.js";
export type { ListWorkflowsInput, ListWorkflowsResult, ListWorkflowsWhere } from "./abstractions.js";
```

- [ ] **Step 11: Add `StoreWorkflow`**

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import type {
    WorkflowConflictError,
    WorkflowNotFoundError,
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";

export interface StoreWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the caller loaded. Omit when creating a new workflow (D131). */
    savedOn?: string | null;
}

export interface IStoreWorkflowUseCaseErrors {
    validation: WorkflowValidationError;
    conflict: WorkflowConflictError;
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IStoreWorkflowUseCaseErrors[keyof IStoreWorkflowUseCaseErrors];

export interface IStoreWorkflowUseCase {
    execute(input: StoreWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update a workflow through one validation path, with an optimistic `savedOn` check
 * on updates. No permission check in 1a (`editor` is enforced in phase 1b).
 */
export const StoreWorkflowUseCase =
    createAbstraction<IStoreWorkflowUseCase>("StoreWorkflowUseCase");

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Input = StoreWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import {
    isWorkflowValidationError,
    WorkflowConflictError,
    WorkflowNotFoundError,
    type WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import {
    WorkflowAfterCreateEvent,
    WorkflowAfterUpdateEvent,
    WorkflowBeforeCreateEvent,
    WorkflowBeforeUpdateEvent
} from "./events.js";
import { StoreWorkflowUseCase as UseCase } from "./abstractions.js";

const WORKFLOW_NOT_FOUND = "Workflows/Workflow/NotFound";

class StoreWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const validation = WorkflowValidator.validate(input.workflow);
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        const values = validation.value;

        const existingResult = await this.repository.get(values.id);
        if (existingResult.isFail() && existingResult.error.code !== WORKFLOW_NOT_FOUND) {
            return Result.fail(existingResult.error);
        }
        const existing = existingResult.isOk() ? existingResult.value : null;

        if (existing && existing.savedOn !== input.savedOn) {
            return Result.fail(
                new WorkflowConflictError({
                    savedOn: existing.savedOn,
                    savedBy: existing.savedBy
                })
            );
        }
        if (!existing && input.savedOn) {
            // No tombstone: the caller only learns that the workflow no longer exists (D123).
            return Result.fail(new WorkflowNotFoundError({ id: values.id }));
        }

        const modelIsFree = await this.ensureModelIsFree(values);
        if (modelIsFree.isFail()) {
            return Result.fail(modelIsFree.error);
        }

        if (existing) {
            return this.update(existing, values);
        }
        return this.create(values);
    }

    private async create(values: WorkflowValues): UseCase.Return {
        const before = await this.publishBefore(new WorkflowBeforeCreateEvent({ workflow: values }));
        if (before.isFail()) {
            return Result.fail(before.error);
        }

        const result = await this.repository.create(values);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterCreateEvent({ workflow: result.value }));
        return Result.ok(result.value);
    }

    private async update(original: Workflow, values: WorkflowValues): UseCase.Return {
        const before = await this.publishBefore(
            new WorkflowBeforeUpdateEvent({ original, workflow: values })
        );
        if (before.isFail()) {
            return Result.fail(before.error);
        }

        const result = await this.repository.update(values);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new WorkflowAfterUpdateEvent({ original, workflow: result.value })
        );
        return Result.ok(result.value);
    }

    /**
     * v1: one workflow per model; the race between two saves is accepted (D41). `limit: 10` is
     * enough because the v1 invariant allows at most one other workflow per model.
     */
    private async ensureModelIsFree(
        values: WorkflowValues
    ): Promise<Result<void, WorkflowValidationError | WorkflowPersistenceError>> {
        const result = await this.repository.list({
            where: { models_in: values.models },
            limit: 10
        });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const other = result.value.items.find(item => item.id !== values.id);
        if (!other) {
            return Result.ok();
        }
        const model = other.models.find(item => values.models.includes(item)) ?? values.models[0];
        return Result.fail(
            new WorkflowValidationError(
                `The model "${model}" already has a workflow: "${other.name}".`
            )
        );
    }

    /** Before handlers reject a save by throwing `WorkflowValidationError`. */
    private async publishBefore(
        event: WorkflowBeforeCreateEvent | WorkflowBeforeUpdateEvent
    ): Promise<Result<void, WorkflowValidationError>> {
        try {
            await this.eventPublisher.publish(event);
            return Result.ok();
        } catch (error) {
            if (isWorkflowValidationError(error)) {
                return Result.fail(error);
            }
            throw error;
        }
    }
}

export const StoreWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, EventPublisher]
});
```

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        container.register(StoreWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/index.ts`:

```ts
export { StoreWorkflowUseCase } from "./abstractions.js";
export type { StoreWorkflowInput } from "./abstractions.js";
export {
    WorkflowAfterCreateEventHandler,
    WorkflowAfterUpdateEventHandler,
    WorkflowBeforeCreateEventHandler,
    WorkflowBeforeUpdateEventHandler
} from "./events.js";
export type {
    WorkflowAfterCreatePayload,
    WorkflowAfterUpdatePayload,
    WorkflowBeforeCreatePayload,
    WorkflowBeforeUpdatePayload
} from "./events.js";
```

- [ ] **Step 12: Add `DeleteWorkflow`**

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface DeleteWorkflowInput {
    id: string;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export interface IDeleteWorkflowUseCase {
    execute(input: DeleteWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Delete a workflow. No permission check in 1a (phase 1b). */
export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Input = DeleteWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowAfterDeleteEvent, WorkflowBeforeDeleteEvent } from "./events.js";
import { DeleteWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const existing = await this.repository.get(input.id);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        const workflow = existing.value;

        await this.eventPublisher.publish(new WorkflowBeforeDeleteEvent({ workflow }));

        const result = await this.repository.delete(workflow.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterDeleteEvent({ workflow }));
        return Result.ok(workflow);
    }
}

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, EventPublisher]
});
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/index.ts`:

```ts
export { DeleteWorkflowUseCase } from "./abstractions.js";
export type { DeleteWorkflowInput } from "./abstractions.js";
export { WorkflowAfterDeleteEventHandler, WorkflowBeforeDeleteEventHandler } from "./events.js";
export type { WorkflowAfterDeletePayload, WorkflowBeforeDeletePayload } from "./events.js";
```

- [ ] **Step 13: Register the new workflow features**

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);

        // Notifications (unchanged until phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
    }
});
```

- [ ] **Step 14: Run the api-workflows tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (`registration.test.ts`, `domain/WorkflowValidator.test.ts`, `workflow/WorkflowUseCases.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 15: Re-point the CMS publishable-model check (failing test first)**

Replace `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts` with:

```ts
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { model } from "~tests/__cms/models.js";

export const createWorkflowValues = (
    models: string[] = [`cms.${model.modelId}`]
): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Test Workflow",
        models,
        steps: [
            {
                id: "step-1",
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                type: "review",
                notifications: [{ id: "e-mail" }],
                config: {
                    teams: ["team-1"],
                    assignment: { strategy: "none", allowManualPick: false, rules: [] }
                }
            }
        ]
    };
};

export const storeWorkflow = async (
    context: CmsContext,
    values: WorkflowValues = createWorkflowValues(),
    savedOn?: string
) => {
    return context.container.resolve(StoreWorkflowUseCase).execute({ workflow: values, savedOn });
};
```

Replace `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";

const expectedMessage = `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is marked as unpublishable.`;

const createUnpublishableContext = async () => {
    const { context } = createContextHandler({
        modifyModel: model => {
            return {
                ...model,
                tags: ["$publishing:false"]
            };
        }
    });
    return context();
};

describe("Disallow unpublishable models", () => {
    it("rejects creating a workflow for an unpublishable model", async () => {
        const context = await createUnpublishableContext();

        const result = await storeWorkflow(context);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("rejects binding an existing workflow to an unpublishable model", async () => {
        const context = await createUnpublishableContext();
        const created = await storeWorkflow(context, createWorkflowValues(["wb.page"]));
        expect(created.isOk()).toBe(true);

        const result = await storeWorkflow(context, createWorkflowValues(), created.value.savedOn);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("rejects a workflow bound to a model that does not exist", async () => {
        const { context } = createContextHandler();

        const result = await storeWorkflow(
            await context(),
            createWorkflowValues(["cms.doesNotExist"])
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('The model "doesNotExist" does not exist.');
    });

    it("allows a workflow for a publishable model", async () => {
        const { context } = createContextHandler();

        const result = await storeWorkflow(await context());

        expect(result.isOk()).toBe(true);
    });
});
```

Replace `packages/api-headless-cms-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { createContextHandler } from "./__handler/context.js";

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        expect(ctx.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
    });
});
```

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: FAIL to compile/run `src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`: `@webiny/api-workflows/features/workflow/CreateWorkflow/events.js` no longer exists. (The new "model that does not exist" test is part of this suite and must pass after Step 16.)

- [ ] **Step 16: Implement the CMS handlers on the new events**

Create `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsBindable.ts`:

```ts
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";

const MODEL_NOT_FOUND = "Cms/Model/NotFound";

/**
 * Spec 4.1, D41: a workflow can only bind an existing, publishable CMS model. Throws
 * `WorkflowValidationError`, which `StoreWorkflowUseCase` returns as a failed result. Non-CMS
 * namespaces (`wb.page`) are skipped; the namespace format itself is checked by
 * `WorkflowValidator` before any event is published. Other model read errors propagate.
 */
export const assertModelsBindable = async (
    getModel: GetModelUseCase.Interface,
    models: string[]
): Promise<void> => {
    for (const namespaceId of models) {
        const modelId = getModelIdFromAppName(namespaceId);
        if (!modelId) {
            continue;
        }
        const model = await getModel.execute(modelId);
        if (model.isFail()) {
            if (model.error.code === MODEL_NOT_FOUND) {
                throw new WorkflowValidationError(`The model "${modelId}" does not exist.`);
            }
            throw model.error;
        }
        const tags = model.value.tags || [];
        if (!tags.includes("$publishing:false")) {
            continue;
        }
        throw new WorkflowValidationError(
            `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`
        );
    }
};
```

Replace `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts` with:

```ts
import { WorkflowBeforeCreateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsBindable } from "../assertModelsBindable.js";

class DisallowUnpublishableModelsOnBeforeCreateImpl
    implements WorkflowBeforeCreateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeCreateEventHandler.Event): Promise<void> {
        await assertModelsBindable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeCreate =
    WorkflowBeforeCreateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeCreateImpl,
        dependencies: [GetModelUseCase]
    });
```

Create `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts`:

```ts
import { WorkflowBeforeUpdateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsBindable } from "../assertModelsBindable.js";

class DisallowUnpublishableModelsOnBeforeUpdateImpl
    implements WorkflowBeforeUpdateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeUpdateEventHandler.Event): Promise<void> {
        await assertModelsBindable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeUpdate =
    WorkflowBeforeUpdateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeUpdateImpl,
        dependencies: [GetModelUseCase]
    });
```

Replace `packages/api-headless-cms-workflows/src/features/Workflows/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { DisallowUnpublishableModelsOnBeforeCreate } from "./handlers/DisallowUnpublishableModelsOnBeforeCreate.js";
import { DisallowUnpublishableModelsOnBeforeUpdate } from "./handlers/DisallowUnpublishableModelsOnBeforeUpdate.js";

export const WorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        container.register(DisallowUnpublishableModelsOnBeforeCreate);
        container.register(DisallowUnpublishableModelsOnBeforeUpdate);
    }
});
```

- [ ] **Step 17: Run every affected suite**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (4 tests in `disallowUnpublishableModels.test.ts`, plus `registration.test.ts`, `entrySystemSchema.test.ts`).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-workflows 2>&1 | tail -50` and `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 18: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows`, `@webiny/api-website-builder-workflows`), then:

```bash
git commit -m "feat(api-workflows): replace workflow model, use cases and events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
