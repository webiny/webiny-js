import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WorkflowConfigServicesFeature } from "./feature.js";
import { WorkflowConfigGateway } from "./gateway/abstractions.js";
import { WorkflowConfigRepository } from "./repository/abstractions.js";
import { ListAiModelsUseCase } from "./useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "./useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "./useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "./useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "./useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "./useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "./useCases/listWorkflowUsers/abstractions.js";

const createContainer = (execute = vi.fn()): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute });
    return container;
};

describe("WorkflowConfigServicesFeature", () => {
    it("registers the config gateway and the config repository as singletons", () => {
        const container = createContainer();
        WorkflowConfigServicesFeature.register(container);

        expect(container.resolve(WorkflowConfigGateway)).toBeDefined();
        expect(container.resolve(WorkflowConfigGateway)).toBe(
            container.resolve(WorkflowConfigGateway)
        );
        expect(container.resolve(WorkflowConfigRepository)).toBeDefined();
        expect(container.resolve(WorkflowConfigRepository)).toBe(
            container.resolve(WorkflowConfigRepository)
        );
    });

    it("registers the seven config use cases transient (R344)", () => {
        const container = createContainer();
        WorkflowConfigServicesFeature.register(container);

        expect(container.resolve(ListStepTypesUseCase)).not.toBe(
            container.resolve(ListStepTypesUseCase)
        );
        expect(container.resolve(ListAutomationDefinitionsUseCase)).not.toBe(
            container.resolve(ListAutomationDefinitionsUseCase)
        );
        expect(container.resolve(ListNotificationTransportsUseCase)).not.toBe(
            container.resolve(ListNotificationTransportsUseCase)
        );
        expect(container.resolve(ListWorkflowTeamsUseCase)).not.toBe(
            container.resolve(ListWorkflowTeamsUseCase)
        );
        expect(container.resolve(ListWorkflowUsersUseCase)).not.toBe(
            container.resolve(ListWorkflowUsersUseCase)
        );
        expect(container.resolve(ListAiModelsUseCase)).not.toBe(
            container.resolve(ListAiModelsUseCase)
        );
        expect(container.resolve(ListAiToolsUseCase)).not.toBe(
            container.resolve(ListAiToolsUseCase)
        );
    });

    it("sends nothing on registration and resolution (R275)", () => {
        const execute = vi.fn();
        const container = createContainer(execute);
        WorkflowConfigServicesFeature.register(container);

        container.resolve(ListAiModelsUseCase);
        container.resolve(ListStepTypesUseCase);

        expect(execute).not.toHaveBeenCalled();
    });

    it("runs a use case over the real repository and gateway", async () => {
        const execute = vi.fn().mockResolvedValue({
            workflows: {
                listNotificationTransports: {
                    data: [{ id: "e-mail", title: "E-mail", description: null }],
                    error: null
                }
            }
        });
        const container = createContainer(execute);
        WorkflowConfigServicesFeature.register(container);
        const useCase = container.resolve(ListNotificationTransportsUseCase);

        const transports = await useCase.execute();

        expect(transports).toEqual([{ id: "e-mail", title: "E-mail", description: null }]);
        expect(execute).toHaveBeenCalledTimes(1);
    });
});
