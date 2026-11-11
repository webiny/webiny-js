import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { WorkflowEditorRepository } from "~/editor/repository/WorkflowEditorRepository.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import type { FakeWorkflowEditorGateway } from "~/editor/testing/fakeWorkflowEditorGateway.js";
import { ListWorkflowModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWorkflowModelsUseCase } from "./ListWorkflowModelsUseCase.js";

const params: UseCaseAbstraction.Params = {
    app: "cms",
    search: "art",
    limit: 20,
    after: "cursor-1"
};

const createUseCase = (gateway: FakeWorkflowEditorGateway): UseCaseAbstraction.Interface => {
    const container = new Container();
    container.registerInstance(WorkflowEditorGateway, gateway);
    container.register(WorkflowEditorRepository).inSingletonScope();
    container.register(ListWorkflowModelsUseCase);
    return container.resolve(UseCaseAbstraction);
};

describe("ListWorkflowModelsUseCase", () => {
    it("passes the params with the app untouched and maps the rows with the page meta", async () => {
        const gateway = createFakeEditorGateway();
        const articleRow = createWorkflowModelRowDto();
        const authorRow = createWorkflowModelRowDto({
            model: "cms.author",
            modelId: "author",
            name: "Author",
            workflow: null
        });
        const pageDto = createWorkflowModelPageDto({
            rows: [articleRow, authorRow],
            meta: { cursor: "cursor-2", hasMoreItems: true }
        });
        gateway.listModels.mockResolvedValue(pageDto);
        const useCase = createUseCase(gateway);

        const page = await useCase.execute(params);

        expect(gateway.listModels).toHaveBeenCalledTimes(1);
        expect(gateway.listModels.mock.calls[0][0]).toBe(params);
        expect(page.cursor).toBe("cursor-2");
        expect(page.hasMoreItems).toBe(true);
        expect(page.rows.map(row => row.model)).toEqual(["cms.article", "cms.author"]);
        expect(page.rows[1].workflow).toBeNull();
    });

    it("lets the gateway's error pass unchanged", async () => {
        const gateway = createFakeEditorGateway();
        const failure = new GraphQLOperationError({
            message: "Not allowed.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listModels.mockRejectedValue(failure);
        const useCase = createUseCase(gateway);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
