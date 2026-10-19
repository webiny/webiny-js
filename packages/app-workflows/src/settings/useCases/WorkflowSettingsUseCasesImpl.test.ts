import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowSettingsGateway } from "~/settings/gateway/WorkflowSettingsGateway.js";
import type { WorkflowSettingsDto } from "~/settings/gateway/dto.js";
import type { WorkflowExclusionDto } from "~/settings/gateway/dto.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { WorkflowSettingsUseCases as UseCasesAbstraction } from "./WorkflowSettingsUseCases.js";
import { WorkflowSettingsUseCases } from "./WorkflowSettingsUseCasesImpl.js";

// Untyped mocks, as the config use-case test: a typed union of two mocks is not callable in `it.each`.
interface FakeGateway {
    getSettings: Mock;
    updateSettings: Mock;
}

const createFakeGateway = (): FakeGateway => {
    return {
        getSettings: vi.fn(),
        updateSettings: vi.fn()
    };
};

interface OperationCase {
    name: string;
    method: keyof FakeGateway;
    run: (useCases: UseCasesAbstraction.Interface) => Promise<unknown>;
}

const SAVED: WorkflowSettings = {
    exclusions: [createExclusion({ userId: "user-1", reason: "On leave" })]
};

const operationCases: OperationCase[] = [
    { name: "getSettings", method: "getSettings", run: useCases => useCases.getSettings() },
    {
        name: "updateSettings",
        method: "updateSettings",
        run: useCases => useCases.updateSettings(SAVED)
    }
];

describe("WorkflowSettingsUseCases (R317)", () => {
    let gateway: FakeGateway;
    let useCases: UseCasesAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, gateway);
        container.register(WorkflowSettingsUseCases).inSingletonScope();
        useCases = container.resolve(UseCasesAbstraction);
    });

    it("always reads the settings with the expired entries (Review Focus 1)", async () => {
        gateway.getSettings.mockResolvedValue({ data: { exclusions: [] }, error: null });

        await useCases.getSettings();

        expect(gateway.getSettings).toHaveBeenCalledTimes(1);
        expect(gateway.getSettings).toHaveBeenCalledWith({ includeExpired: true });
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
        gateway.getSettings.mockResolvedValue({ data: dto, error: null });

        const settings = await useCases.getSettings();

        expect(settings).toEqual({
            exclusions: [
                { userId: "user-3", reason: "Old", endsOn: "2020-01-01T00:00:00.000Z" },
                { userId: "user-2", reason: null, endsOn: null }
            ]
        });
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
        gateway.updateSettings.mockResolvedValue({ data: saved, error: null });

        const result = await useCases.updateSettings(settings);

        expect(gateway.updateSettings).toHaveBeenCalledTimes(1);
        expect(gateway.updateSettings).toHaveBeenCalledWith({
            exclusions: [
                { userId: "user-1", reason: "On leave", endsOn: null },
                { userId: "user-2", reason: null, endsOn: "2020-01-01T00:00:00.000Z" }
            ]
        });
        expect(result).toEqual(settings);
        expect(result).not.toBe(settings);
    });

    it("sends an empty list as an empty list", async () => {
        gateway.updateSettings.mockResolvedValue({ data: { exclusions: [] }, error: null });

        const result = await useCases.updateSettings({ exclusions: [] });

        expect(gateway.updateSettings).toHaveBeenCalledWith({ exclusions: [] });
        expect(result).toEqual({ exclusions: [] });
    });

    it("throws a validation error of a save with its code, message and data", async () => {
        gateway.updateSettings.mockResolvedValue({
            data: null,
            error: {
                code: SettingsErrorCode.Validation,
                message: "This user is already in the list. Edit it instead.",
                data: { userId: "user-1" }
            }
        });

        const promise = useCases.updateSettings(SAVED);

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            code: SettingsErrorCode.Validation,
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        });
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(WorkflowSettingsGateway, createFakeGateway());
        container.register(WorkflowSettingsUseCases).inSingletonScope();

        expect(container.resolve(UseCasesAbstraction)).toBe(container.resolve(UseCasesAbstraction));
    });

    describe("errors (R204)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError for an error envelope",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({
                    data: null,
                    error: {
                        code: SettingsErrorCode.NotAuthorized,
                        message: "You are not allowed to change the workflow settings.",
                        data: { action: "change the workflow settings" }
                    }
                });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: SettingsErrorCode.NotAuthorized,
                    message: "You are not allowed to change the workflow settings.",
                    data: { action: "change the workflow settings" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws when the server answers with neither data nor error",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({ data: null, error: null });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                gateway[operationCase.method].mockRejectedValue(failure);

                await expect(operationCase.run(useCases)).rejects.toBe(failure);
            }
        );
    });
});
