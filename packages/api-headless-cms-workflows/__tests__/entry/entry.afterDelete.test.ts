import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { createWorkflow } from "~tests/__workflows/workflow.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/index.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { StartWorkflowStateStepUseCase } from "@webiny/api-workflows/features/workflowState/StartWorkflowStateStep/index.js";
import { ApproveWorkflowStateStepUseCase } from "@webiny/api-workflows/features/workflowState/ApproveWorkflowStateStep/index.js";
import { FULL_ACCESS_TEAM_ID } from "@webiny/testing";
import { GetUserTeamsUseCase } from "@webiny/api-workflows/features/internal/GetUserTeams/index.js";
import { Result } from "@webiny/feature/api/index.js";
import { WorkflowStateRecordState } from "@webiny/api-workflows/domain/workflowState/abstractions.js";
import { ListWorkflowStatesUseCase } from "@webiny/api-workflows/features/workflowState/ListWorkflowStates/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

describe("On After Entry Delete", () => {
    it("should remove content review when deleted entry which was under review", async () => {
        const { context: createContext } = createContextHandler({
            identity: {
                id: "main-user",
                displayName: "MainUser",
                type: "admin",
                teams: [FULL_ACCESS_TEAM_ID]
            }
        });

        const context = await createContext();
        const { workflow } = await createWorkflow(context);

        context.container.registerInstance(GetUserTeamsUseCase, {
            async execute() {
                return Result.ok([{ id: FULL_ACCESS_TEAM_ID }]);
            }
        });

        // Resolve use cases from DI container
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const createWorkflowState = context.container.resolve(CreateWorkflowStateUseCase);
        const startWorkflowState = context.container.resolve(StartWorkflowStateStepUseCase);
        const approveWorkflowState = context.container.resolve(ApproveWorkflowStateStepUseCase);
        const listWorkflowStates = context.container.resolve(ListWorkflowStatesUseCase);

        // Get the model
        const modelResult = await getModel.execute(modelDefinition.modelId);
        expect(modelResult.isOk()).toBe(true);
        const model = modelResult.value!;

        // Create an entry
        const entryResult = await createEntry.execute(model, {
            values: {
                name: "John Doe"
            }
        });
        expect(entryResult.isOk()).toBe(true);
        const entry = entryResult.value!;
        // then attach a content review
        const state = await createWorkflowState.execute({
            app: workflow.app,
            title: entry.values.name,
            targetRevisionId: entry.id
        });
        expect(state.isOk()).toBe(true);

        const identityCtx = context.container.resolve(IdentityContext);
        const identity = identityCtx.getIdentity();
        // @ts-expect-error
        identity.data.id = "user-which-can-edit";
        // @ts-expect-error
        identity.profile.id = "user-which-can-edit";
        identityCtx.setIdentity(identity);

        const startResult = await startWorkflowState.execute(state.value.id);
        expect(startResult.isOk()).toBe(true);
        const approveResult = await approveWorkflowState.execute(state.value.id);

        expect(approveResult.isOk()).toBe(true);
        expect(approveResult.value.state).toEqual(WorkflowStateRecordState.approved);

        const beforeDelete = await listWorkflowStates.execute();
        expect(beforeDelete.isOk()).toBe(true);
        expect(beforeDelete.value.items).toHaveLength(1);
        // delete the entry
        await context.cms.deleteEntry(model, entry.id, {
            permanently: true
        });
        // there must be no content review

        const afterDelete = await listWorkflowStates.execute();
        expect(afterDelete.isOk()).toBe(true);
        expect(afterDelete.value.items).toEqual([]);
    });
});
