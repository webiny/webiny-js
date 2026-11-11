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
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";
import { ListAiToolsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiToolsUseCase } from "./ListAiToolsUseCase.js";

describe("ListAiToolsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListAiToolsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("asks for the AI tools only when called and maps them with changesContent (R275)", async () => {
        gateway.listAiTools.mockResolvedValue([createAiToolDto({ changesContent: true })]);

        expect(gateway.listAiTools).not.toHaveBeenCalled();

        const tools = await useCase.execute();

        expect(tools).toEqual([createAiTool({ changesContent: true })]);
        expect(gateway.listAiTools).toHaveBeenCalledTimes(1);
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listAiTools.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
