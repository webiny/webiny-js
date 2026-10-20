import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(DeleteWorkflowUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("DeleteWorkflowUseCase", () => {
    it("deletes the workflow of the app by id and maps the deleted workflow", async () => {
        const gateway = createFakeEditorGateway();
        const deleted = createEditorWorkflowDto({ id: "workflow-1" });
        gateway.deleteWorkflow.mockResolvedValue(deleted);
        const useCase = createUseCase(gateway);

        const workflow = await useCase.execute({ app: "cms", id: "workflow-1" });

        expect(gateway.deleteWorkflow).toHaveBeenCalledWith({ app: "cms", id: "workflow-1" });
        expect(workflow.id).toBe("workflow-1");
    });

    it("lets a blocked delete pass unchanged, with the count and the reviews", async () => {
        const gateway = createFakeEditorGateway();
        const blocked = new GraphQLOperationError({
            message: "The workflow has reviews in progress.",
            code: WorkflowErrorCode.HasActiveReviews,
            data: { count: 2, reviews: [{ reviewId: "review-1", title: "Spring campaign" }] }
        });
        gateway.deleteWorkflow.mockRejectedValue(blocked);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute({ app: "wb", id: "workflow-1" })).rejects.toBe(blocked);
    });
});
