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
import { createEditorStepTypeDto } from "~/editor/testing/editorFixtures.js";
import { ListStepTypesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepTypesUseCase } from "./ListStepTypesUseCase.js";

describe("ListStepTypesUseCase", () => {
    let gateway: FakeWorkflowConfigGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeConfigGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigRepository).inSingletonScope();
        container.register(ListStepTypesUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("lists the step types in the order the server returns them and narrows the schema", async () => {
        const configSchema = { type: "object", properties: { teams: { type: "array" } } };
        gateway.listStepTypes.mockResolvedValue([
            createEditorStepTypeDto({ type: "ai", title: "AI", configSchema: null }),
            createEditorStepTypeDto({ type: "review", configSchema }),
            createEditorStepTypeDto({
                type: "automation",
                available: false,
                unavailableReason: "No automations are available."
            })
        ]);

        const stepTypes = await useCase.execute();

        expect(gateway.listStepTypes).toHaveBeenCalledTimes(1);
        expect(stepTypes.map(stepType => stepType.type)).toEqual(["ai", "review", "automation"]);
        expect(stepTypes[1].configSchema).toBe(configSchema);
        expect(stepTypes[0].configSchema).toBeNull();
        expect(stepTypes[2].unavailableReason).toBe("No automations are available.");
    });

    it("lets a server error of the gateway pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
        gateway.listStepTypes.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });
});
