import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository as ReviewRepositoryAbstraction } from "~/review/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

const params: UseCaseAbstraction.Params = { app: "cms", id: "workflow-1" };

describe("DeleteWorkflowUseCase", () => {
    let editorGateway: FakeWorkflowEditorGateway;
    let reviewGateway: FakeReviewGateway;
    let reviewRepository: ReviewRepositoryAbstraction.Interface;
    let useCase: UseCaseAbstraction.Interface;

    const primeBothLists = async (): Promise<void> => {
        await reviewRepository.listWorkflows("cms.article");
        await reviewRepository.listWorkflows("wb.page");
    };

    const listLoadsOf = (app: string): number => {
        return reviewGateway.listWorkflows.mock.calls.filter(call => call[0] === app).length;
    };

    beforeEach(() => {
        editorGateway = createFakeEditorGateway();
        reviewGateway = createFakeReviewGateway();
        const cmsWorkflow = createWorkflowDto("workflow-1", ["cms.article"]);
        reviewGateway.listWorkflows.mockResolvedValue([cmsWorkflow]);
        const container = new Container();
        container.registerInstance(WorkflowEditorGateway, editorGateway);
        container.registerInstance(ReviewGateway, reviewGateway);
        container.register(WorkflowEditorRepository).inSingletonScope();
        container.register(ReviewRepository).inSingletonScope();
        container.register(DeleteWorkflowUseCase);
        reviewRepository = container.resolve(ReviewRepositoryAbstraction);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the app and the id and maps the deleted workflow", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.deleteWorkflow.mockResolvedValue(dto);

        const workflow = await useCase.execute(params);

        expect(editorGateway.deleteWorkflow).toHaveBeenCalledWith(params);
        expect(workflow.id).toBe("workflow-1");
    });

    it("clears the app's workflow list after a successful delete, and only that app's (R350)", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.deleteWorkflow.mockResolvedValue(dto);
        await primeBothLists();

        await useCase.execute(params);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(2);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("clears the app's list when the workflow was already gone, and rethrows (R350)", async () => {
        const gone = new GraphQLOperationError({
            message: "Not found.",
            code: WorkflowErrorCode.NotFound,
            data: { id: "workflow-1" }
        });
        editorGateway.deleteWorkflow.mockRejectedValue(gone);
        await primeBothLists();

        await expect(useCase.execute({ app: "wb", id: "workflow-1" })).rejects.toBe(gone);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(2);
    });

    it("keeps the cache for a blocked delete and passes the error on as it is", async () => {
        const data = { count: 2, reviews: [createBlockingReviewDto()] };
        const blocked = new GraphQLOperationError({
            message: "The workflow has reviews in progress.",
            code: WorkflowErrorCode.HasActiveReviews,
            data
        });
        editorGateway.deleteWorkflow.mockRejectedValue(blocked);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(blocked);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
    });

    it("keeps the cache after a transport failure", async () => {
        const transport = new Error("Failed to fetch");
        editorGateway.deleteWorkflow.mockRejectedValue(transport);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(transport);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(1);
    });
});
