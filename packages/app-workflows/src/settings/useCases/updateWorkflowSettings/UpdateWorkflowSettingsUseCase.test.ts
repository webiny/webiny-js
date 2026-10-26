import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { WorkflowSettingsDto } from "~/settings/gateway/dto.js";
import { WorkflowSettingsRepository } from "~/settings/repository/WorkflowSettingsRepository.js";
import { createFakeWorkflowSettingsGateway } from "~/settings/testing/fakeWorkflowSettingsGateway.js";
import type { FakeWorkflowSettingsGateway } from "~/settings/testing/fakeWorkflowSettingsGateway.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { UpdateWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "./UpdateWorkflowSettingsUseCase.js";

const SAVED: WorkflowSettings = {
    exclusions: [createExclusion({ userId: "user-1", reason: "On leave" })]
};

describe("UpdateWorkflowSettingsUseCase (R317, R318, A108)", () => {
    let gateway: FakeWorkflowSettingsGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeWorkflowSettingsGateway();
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, gateway);
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(UpdateWorkflowSettingsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("sends exactly the given list, nulls kept, and returns the saved record mapped (R318, A108)", async () => {
        const settings: WorkflowSettings = {
            exclusions: [
                createExclusion({ userId: "user-1", reason: "On leave" }),
                createExclusion({ userId: "user-2", endsOn: "2020-01-01T00:00:00.000Z" })
            ]
        };
        const saved: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: null },
                { userId: "user-2", reason: null, endsOn: "2020-01-01T00:00:00.000Z" }
            ]
        };
        gateway.updateSettings.mockResolvedValue(saved);

        const result = await useCase.execute(settings);

        expect(gateway.updateSettings).toHaveBeenCalledTimes(1);
        expect(gateway.updateSettings).toHaveBeenCalledWith({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: null },
                { userId: "user-2", reason: null, endsOn: "2020-01-01T00:00:00.000Z" }
            ]
        });
        expect(gateway.getSettings).not.toHaveBeenCalled();
        expect(result).toEqual(settings);
        expect(result).not.toBe(settings);
    });

    it("sends an empty list as an empty list", async () => {
        gateway.updateSettings.mockResolvedValue({ exclusions: [] });

        const result = await useCase.execute({ exclusions: [] });

        expect(gateway.updateSettings).toHaveBeenCalledWith({ exclusions: [] });
        expect(result).toEqual({ exclusions: [] });
    });

    it("lets a validation error of a save pass with its code, message and data", async () => {
        const error = new GraphQLOperationError({
            message: "This user is already in the list. Edit it instead.",
            code: "Workflows/Settings/Validation",
            data: { userId: "user-1" }
        });
        gateway.updateSettings.mockRejectedValue(error);

        const promise = useCase.execute(SAVED);

        await expect(promise).rejects.toBe(error);
        await expect(promise).rejects.toMatchObject({
            code: "Workflows/Settings/Validation",
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        });
    });

    it("lets a transport failure pass as it is", async () => {
        const failure = new Error("Network down.");
        gateway.updateSettings.mockRejectedValue(failure);

        await expect(useCase.execute(SAVED)).rejects.toBe(failure);
    });
});
