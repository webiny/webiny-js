import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

const input: EditorWorkflowInput = {
    id: "workflow-1",
    name: "Article review",
    models: ["cms.article"],
    steps: [
        {
            id: "step-1",
            title: "Editorial check",
            color: "var(--color-primary-500)",
            description: null,
            type: "review",
            notifications: [{ id: "e-mail" }],
            config: { teams: ["team-1"] }
        }
    ]
};

const params: UseCaseAbstraction.Params = { app: "cms", data: input, savedOn: EDITOR_SAVED_ON };

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(StoreWorkflowUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("StoreWorkflowUseCase", () => {
    it("sends the data and the loaded savedOn string unchanged with the app (D131)", async () => {
        const gateway = createFakeEditorGateway();
        const useCase = createUseCase(gateway);

        await useCase.execute(params);

        expect(gateway.storeWorkflow).toHaveBeenCalledTimes(1);
        const sent = gateway.storeWorkflow.mock.calls[0][0];
        expect(sent).toBe(params);
        expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
    });

    it("sends null for a new workflow", async () => {
        const gateway = createFakeEditorGateway();
        const useCase = createUseCase(gateway);

        await useCase.execute({ app: "wb", data: input, savedOn: null });

        const sent = gateway.storeWorkflow.mock.calls[0][0];
        expect(sent.savedOn).toBeNull();
        expect(sent.app).toBe("wb");
    });

    it("returns the stored workflow with the new savedOn string unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const stored = createEditorWorkflowDto({ savedOn: "2026-10-18T11:30:00.456Z" });
        gateway.storeWorkflow.mockResolvedValue(stored);
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute(params);

        expect(workflow.savedOn).toBe("2026-10-18T11:30:00.456Z");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const gateway = createFakeEditorGateway();
        const conflict = new GraphQLOperationError({
            message: "The workflow was changed by Grace Hopper.",
            code: WorkflowErrorCode.Conflict,
            data: { savedOn: "2026-10-18T10:00:00.000Z" }
        });
        gateway.storeWorkflow.mockRejectedValue(conflict);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(conflict);
    });
});
