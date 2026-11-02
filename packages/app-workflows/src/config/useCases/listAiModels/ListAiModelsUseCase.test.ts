import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { WorkflowConfigRepository } from "~/config/repository/WorkflowConfigRepository.js";
import { createFakeConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import type { FakeWorkflowConfigGateway } from "~/config/testing/fakeWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { ListAiModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiModelsUseCase } from "./ListAiModelsUseCase.js";

describe("ListAiModelsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListAiModelsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("asks the gateway for the AI models once and returns them as they are (R275)", async () => {
        gateway.listAiModels.mockResolvedValue([createAiModel()]);

        const models = await useCase.execute();

        expect(models).toEqual([createAiModel()]);
        expect(gateway.listAiModels).toHaveBeenCalledTimes(1);
    });

    it("returns an empty list as an empty list", async () => {
        gateway.listAiModels.mockResolvedValue([]);

        expect(await useCase.execute()).toEqual([]);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listAiModels.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
