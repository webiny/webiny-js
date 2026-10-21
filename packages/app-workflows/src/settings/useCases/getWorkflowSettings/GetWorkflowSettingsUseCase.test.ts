import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/abstractions.js";
import type { WorkflowExclusionDto } from "~/settings/gateway/dto.js";
import type { WorkflowSettingsDto } from "~/settings/gateway/dto.js";
import { WorkflowSettingsRepository } from "~/settings/repository/WorkflowSettingsRepository.js";
import { GetWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

interface FakeGateway {
    getSettings: Mock<WorkflowSettingsGateway.Interface["getSettings"]>;
    updateSettings: Mock<WorkflowSettingsGateway.Interface["updateSettings"]>;
}

const createFakeGateway = (): FakeGateway => {
    return {
        getSettings: vi.fn(),
        updateSettings: vi.fn()
    };
};

describe("GetWorkflowSettingsUseCase (R317, R351)", () => {
    let gateway: FakeGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, gateway);
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(GetWorkflowSettingsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("always reads the settings with the expired entries (R317)", async () => {
        gateway.getSettings.mockResolvedValue({ exclusions: [] });

        await useCase.execute();

        expect(gateway.getSettings).toHaveBeenCalledTimes(1);
        expect(gateway.getSettings).toHaveBeenCalledWith({ includeExpired: true });
        expect(gateway.updateSettings).not.toHaveBeenCalled();
    });

    it("maps the read settings, expired entries and absent values included, in the server's order", async () => {
        const withoutReason: WorkflowExclusionDto = {
            userId: "user-2",
            reason: null,
            endsOn: null
        };
        Reflect.deleteProperty(withoutReason, "reason");
        const dto: WorkflowSettingsDto = {
            exclusions: [
                { userId: "user-3", reason: "Old", endsOn: "2020-01-01T00:00:00.000Z" },
                withoutReason
            ]
        };
        gateway.getSettings.mockResolvedValue(dto);

        const settings = await useCase.execute();

        expect(settings).toEqual({
            exclusions: [
                { userId: "user-3", reason: "Old", endsOn: "2020-01-01T00:00:00.000Z" },
                { userId: "user-2", reason: null, endsOn: null }
            ]
        });
    });

    it("lets the gateway's GraphQLOperationError pass as it is", async () => {
        const error = new GraphQLOperationError({
            message: "You are not allowed to view the workflow settings.",
            code: SettingsErrorCode.NotAuthorized,
            data: { action: "view the workflow settings" }
        });
        gateway.getSettings.mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toBe(error);
    });

    it("lets a transport failure pass as it is", async () => {
        const failure = new Error("Network down.");
        gateway.getSettings.mockRejectedValue(failure);

        await expect(useCase.execute()).rejects.toBe(failure);
    });

    it("is transient: every resolve is a new instance", () => {
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, createFakeGateway());
        container.register(WorkflowSettingsRepository).inSingletonScope();
        container.register(GetWorkflowSettingsUseCase);

        expect(container.resolve(UseCaseAbstraction)).not.toBe(
            container.resolve(UseCaseAbstraction)
        );
    });
});
