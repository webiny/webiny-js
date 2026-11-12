import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflow } from "~tests/__workflows/workflow.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";
import { GetTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetTargetWorkflowState/index.js";
import { GetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetWorkflowState/index.js";
import { ListWorkflowStatesUseCase } from "@webiny/api-workflows/features/workflowState/ListWorkflowStates/index.js";
import { CancelWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/CancelWorkflowState/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { GetUserTeamsUseCase } from "@webiny/api-workflows/features/internal/GetUserTeams/index.js";
import { Result } from "@webiny/feature/api/index.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { UseContextHandlerParams } from "@webiny/testing";

type Permissions = NonNullable<UseContextHandlerParams["permissions"]>;

const cmsReadPermissions: Permissions = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" },
    { name: "cms.contentEntry", rwd: "r" }
];

const cmsWritePermissions: Permissions = [
    { name: "cms.endpoint.manage" },
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" },
    { name: "cms.contentEntry", rwd: "rwd", pw: "rcpu" }
];

/**
 * A context of an identity which is in no team, so never a reviewer.
 */
const createLimitedContext = async (id: string, permissions: Permissions) => {
    const { context: createContext } = createContextHandler({
        identity: { id, displayName: id, type: "admin" },
        permissions
    });
    const context = await createContext();
    context.container.registerInstance(GetUserTeamsUseCase, {
        async execute() {
            return Result.ok([]);
        }
    });
    return context;
};

const createEntry = async (context: CmsContext) => {
    const modelResult = await context.container
        .resolve(GetModelUseCase)
        .execute(modelDefinition.modelId);
    expect(modelResult.isOk()).toBe(true);
    const entryResult = await context.container
        .resolve(CreateEntryUseCase)
        .execute(modelResult.value!, { values: { name: "John Doe" } });
    expect(entryResult.isOk()).toBe(true);
    return entryResult.value!;
};

describe("workflow state access (cms)", () => {
    it("should require write access to the entry to create a state", async () => {
        const { context: createContext } = createContextHandler();
        const adminContext = await createContext();
        const { workflow } = await createWorkflow(adminContext);
        const entry = await createEntry(adminContext);

        for (const permissions of [[], cmsReadPermissions] as Permissions[]) {
            const context = await createLimitedContext("limited-user", permissions);
            const result = await context.container.resolve(CreateWorkflowStateUseCase).execute({
                app: workflow!.app,
                targetRevisionId: entry.id,
                title: "Attacker title"
            });
            expect(result.isFail()).toBe(true);
            expect(result.error!.code).toBe("Workflows/State/NotAuthorized");
        }

        // Nothing was created.
        const getResult = await adminContext.container
            .resolve(GetTargetWorkflowStateUseCase)
            .execute({ app: workflow!.app, targetRevisionId: entry.id });
        expect(getResult.isFail()).toBe(true);
        expect(getResult.error!.code).toBe("Workflows/State/NotFound");
    });

    it("should fail to create a state when the entry does not exist", async () => {
        const { context: createContext } = createContextHandler();
        const adminContext = await createContext();
        const { workflow } = await createWorkflow(adminContext);

        const result = await adminContext.container.resolve(CreateWorkflowStateUseCase).execute({
            app: workflow!.app,
            targetRevisionId: "non-existing-entry#0001",
            title: "Missing"
        });
        expect(result.isFail()).toBe(true);
        expect(result.error!.code).toBe("Workflows/State/NotAuthorized");
    });

    it("should let an editor create, read and cancel own state, and readers read it", async () => {
        const { context: createContext } = createContextHandler();
        const adminContext = await createContext();
        const { workflow } = await createWorkflow(adminContext);
        const entry = await createEntry(adminContext);
        const app = workflow!.app;

        const editorContext = await createLimitedContext("editor-user", cmsWritePermissions);

        // The admin review UI lists workflows of the app for content editors.
        const listWorkflowsResult = await editorContext.container
            .resolve(ListWorkflowsUseCase)
            .execute({ where: { app } });
        expect(listWorkflowsResult.isOk()).toBe(true);
        expect(listWorkflowsResult.value!.items).toHaveLength(1);

        const stateResult = await editorContext.container
            .resolve(CreateWorkflowStateUseCase)
            .execute({ app, targetRevisionId: entry.id, title: "Review" });
        expect(stateResult.isOk()).toBe(true);
        const state = stateResult.value!;

        // A reader of the model can read the state and the workflow.
        const readerContext = await createLimitedContext("reader-user", cmsReadPermissions);
        const readerGet = await readerContext.container
            .resolve(GetTargetWorkflowStateUseCase)
            .execute({ app, targetRevisionId: entry.id });
        expect(readerGet.isOk()).toBe(true);
        const readerList = await readerContext.container
            .resolve(ListWorkflowStatesUseCase)
            .execute({ where: { app } });
        expect(readerList.isOk()).toBe(true);
        expect(readerList.value!.items.map(item => item.id)).toEqual([state.id]);
        const readerWorkflow = await readerContext.container
            .resolve(GetWorkflowUseCase)
            .execute({ app, id: workflow!.id });
        expect(readerWorkflow.isOk()).toBe(true);

        // A reader can't cancel someone else's review.
        const readerCancel = await readerContext.container
            .resolve(CancelWorkflowStateUseCase)
            .execute(state.id);
        expect(readerCancel.isFail()).toBe(true);
        expect(readerCancel.error!.code).toBe("Workflows/State/NotAuthorized");

        // An identity without CMS access reads nothing.
        const outsiderContext = await createLimitedContext("outsider-user", []);
        const outsiderGet = await outsiderContext.container
            .resolve(GetWorkflowStateUseCase)
            .execute(state.id);
        expect(outsiderGet.isFail()).toBe(true);
        expect(outsiderGet.error!.code).toBe("Workflows/State/NotAuthorized");
        const outsiderList = await outsiderContext.container
            .resolve(ListWorkflowStatesUseCase)
            .execute({ where: { app } });
        expect(outsiderList.isOk()).toBe(true);
        expect(outsiderList.value!.items).toEqual([]);
        const outsiderWorkflows = await outsiderContext.container
            .resolve(ListWorkflowsUseCase)
            .execute({ where: { app } });
        expect(outsiderWorkflows.isFail()).toBe(true);
        expect(outsiderWorkflows.error!.code).toBe("Workflows/Workflow/NotAuthorized");

        // The creator cancels own review.
        const editorCancel = await editorContext.container
            .resolve(CancelWorkflowStateUseCase)
            .execute(state.id);
        expect(editorCancel.isOk()).toBe(true);
        expect(editorCancel.value!.isActive).toBe(false);
    });
});
