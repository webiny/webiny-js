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
import { createAutomationDefinitionDto } from "~/editor/testing/editorFixtures.js";
import { ListAutomationDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAutomationDefinitionsUseCase } from "./ListAutomationDefinitionsUseCase.js";

describe("ListAutomationDefinitionsUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListAutomationDefinitionsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the automation definitions and narrows the settings schema", async () => {
        const settingsSchema = { type: "object", properties: { timeout: { type: "number" } } };
        gateway.listAutomationDefinitions.mockResolvedValue([
            createAutomationDefinitionDto({ id: "automation-1", settingsSchema }),
            createAutomationDefinitionDto({ id: "automation-2", settingsSchema: null })
        ]);

        const definitions = await useCase.execute();

        expect(gateway.listAutomationDefinitions).toHaveBeenCalledTimes(1);
        expect(definitions.map(definition => definition.id)).toEqual([
            "automation-1",
            "automation-2"
        ]);
        expect(definitions[0].settingsSchema).toBe(settingsSchema);
        expect(definitions[1].settingsSchema).toBeNull();
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listAutomationDefinitions.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
