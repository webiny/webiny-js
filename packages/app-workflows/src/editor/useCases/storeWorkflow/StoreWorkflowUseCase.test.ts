import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository as ReviewRepositoryAbstraction } from "~/review/repository/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
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

const failure = (code: string, data: unknown = null): GraphQLOperationError => {
    return new GraphQLOperationError({ message: "The store failed.", code, data });
};

describe("StoreWorkflowUseCase", () => {
    let editorGateway: FakeWorkflowEditorGateway;
    let reviewGateway: FakeReviewGateway;
    let reviewRepository: ReviewRepositoryAbstraction.Interface;
    let useCase: UseCaseAbstraction.Interface;

    // Loads and caches both apps' workflow lists, as the review bars of two editors would.
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
        container.register(StoreWorkflowUseCase);
        reviewRepository = container.resolve(ReviewRepositoryAbstraction);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("sends the data and the loaded savedOn string unchanged with the app (D131)", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);

        await useCase.execute(params);

        expect(editorGateway.storeWorkflow).toHaveBeenCalledTimes(1);
        const sent = editorGateway.storeWorkflow.mock.calls[0][0];
        expect(sent).toBe(params);
        expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
    });

    it("sends null for a new workflow", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);

        await useCase.execute({ app: "wb", data: input, savedOn: null });

        const sent = editorGateway.storeWorkflow.mock.calls[0][0];
        expect(sent.savedOn).toBeNull();
        expect(sent.app).toBe("wb");
    });

    it("returns the stored workflow with the new savedOn string unchanged", async () => {
        const dto = createEditorWorkflowDto({ savedOn: "2026-10-18T11:30:00.456Z" });
        editorGateway.storeWorkflow.mockResolvedValue(dto);

        const workflow = await useCase.execute(params);

        expect(workflow).toEqual(createEditorWorkflow({ savedOn: "2026-10-18T11:30:00.456Z" }));
    });

    it("clears the app's workflow list after a successful store, and only that app's (R350)", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);
        await primeBothLists();

        await useCase.execute(params);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(2);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("clears the Website Builder list for a Website Builder store", async () => {
        const dto = createEditorWorkflowDto();
        editorGateway.storeWorkflow.mockResolvedValue(dto);
        await primeBothLists();

        await useCase.execute({ ...params, app: "wb" });
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(2);
    });

    it("clears the app's list when the server says the workflow is gone, and rethrows (R350)", async () => {
        const gone = failure(WorkflowErrorCode.NotFound, { id: "workflow-1" });
        editorGateway.storeWorkflow.mockRejectedValue(gone);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(gone);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(2);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("keeps the cache after a conflict, a validation error or a transport failure", async () => {
        const conflict = failure(WorkflowErrorCode.Conflict, {
            savedOn: "2026-10-18T10:00:00.000Z"
        });
        const validation = failure(WorkflowErrorCode.Validation, {
            stepId: "step-1",
            field: "config.teams",
            workflowId: null
        });
        const transport = new Error("Network down.");
        editorGateway.storeWorkflow.mockRejectedValueOnce(conflict);
        editorGateway.storeWorkflow.mockRejectedValueOnce(validation);
        editorGateway.storeWorkflow.mockRejectedValueOnce(transport);
        await primeBothLists();

        await expect(useCase.execute(params)).rejects.toBe(conflict);
        await expect(useCase.execute(params)).rejects.toBe(validation);
        await expect(useCase.execute(params)).rejects.toBe(transport);
        await primeBothLists();

        expect(listLoadsOf("cms")).toBe(1);
        expect(listLoadsOf("wb")).toBe(1);
    });

    it("keeps the code and the data of a conflict for the editor's banner", async () => {
        const conflict = failure(WorkflowErrorCode.Conflict, {
            savedOn: "2026-10-18T10:00:00.000Z",
            savedBy: { id: "user-2", displayName: "Grace" }
        });
        editorGateway.storeWorkflow.mockRejectedValue(conflict);

        await expect(useCase.execute(params)).rejects.toMatchObject({
            code: WorkflowErrorCode.Conflict,
            data: {
                savedOn: "2026-10-18T10:00:00.000Z",
                savedBy: { id: "user-2", displayName: "Grace" }
            }
        });
    });
});
