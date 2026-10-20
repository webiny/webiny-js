import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { GetWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(GetWorkflowUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("GetWorkflowUseCase", () => {
    it("asks for the workflow of the app by id and maps it", async () => {
        const gateway = createFakeEditorGateway();
        const dto = createEditorWorkflowDto();
        gateway.getWorkflow.mockResolvedValue(dto);
        const expected = createEditorWorkflow();
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute({ app: "wb", id: "workflow-1" });

        expect(gateway.getWorkflow).toHaveBeenCalledWith({ app: "wb", id: "workflow-1" });
        expect(workflow).toEqual(expected);
    });

    it("keeps the savedOn string as the server sent it (D131)", async () => {
        const gateway = createFakeEditorGateway();
        const dto = createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30.123Z" });
        gateway.getWorkflow.mockResolvedValue(dto);
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute({ app: "cms", id: "workflow-1" });

        expect(workflow.savedOn).toBe("2026-10-18T09:15:30.123Z");
    });

    it("lets the gateway's error pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new GraphQLOperationError({
            message: "No workflow.",
            code: WorkflowErrorCode.NotFound,
            data: { id: "workflow-1" }
        });
        gateway.getWorkflow.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute({ app: "cms", id: "workflow-1" })).rejects.toBe(failure);
    });

    it("is transient: every resolve is a new instance", () => {
        const gateway = createFakeEditorGateway();
        const container = new Container();
        container.registerInstance(WorkflowEditorGateway, gateway);
        container.register(WorkflowEditorRepository).inSingletonScope();
        container.register(GetWorkflowUseCase);

        expect(container.resolve(UseCaseAbstraction)).not.toBe(
            container.resolve(UseCaseAbstraction)
        );
    });
});
