import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettingsDto } from "./dto.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowSettingsGateway } from "./WorkflowSettingsGateway.js";

const SETTINGS: WorkflowSettingsDto = {
    exclusions: [
        { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" },
        { userId: "user-2", reason: null, endsOn: null }
    ]
};

// The fields the page reads of every exclusion (R317).
const SETTINGS_SELECTION = /exclusions\s*\{\s*userId\s+reason\s+endsOn\s*\}/;

interface OperationCase {
    name: string;
    field: "getSettings" | "updateSettings";
    run: (gateway: GatewayAbstraction.Interface) => Promise<WorkflowSettingsDto>;
}

const operationCases: OperationCase[] = [
    {
        name: "getSettings",
        field: "getSettings",
        run: gateway => gateway.getSettings({ includeExpired: true })
    },
    {
        name: "updateSettings",
        field: "updateSettings",
        run: gateway => gateway.updateSettings(SETTINGS)
    }
];

describe("WorkflowSettingsGateway (R317, R346)", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WorkflowSettingsGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("reads the settings on the workflows root with includeExpired as the variable", async () => {
        client.execute.mockResolvedValue({
            workflows: { getSettings: { data: SETTINGS, error: null } }
        });

        const result = await gateway.getSettings({ includeExpired: true });

        expect(result).toEqual(SETTINGS);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: true });
        expect(request.query).toContain("query GetWorkflowSettings($includeExpired: Boolean)");
        expect(request.query).toContain("workflows");
        expect(request.query).toContain("getSettings(includeExpired: $includeExpired)");
        expect(request.query).toMatch(SETTINGS_SELECTION);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("passes includeExpired through as it is given", async () => {
        client.execute.mockResolvedValue({
            workflows: { getSettings: { data: { exclusions: [] }, error: null } }
        });

        await gateway.getSettings({ includeExpired: false });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: false });
    });

    it("updates the settings with the whole list as the data variable", async () => {
        client.execute.mockResolvedValue({
            workflows: { updateSettings: { data: SETTINGS, error: null } }
        });

        const result = await gateway.updateSettings(SETTINGS);

        expect(result).toEqual(SETTINGS);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ data: SETTINGS });
        expect(request.query).toContain(
            "mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!)"
        );
        expect(request.query).toContain("updateSettings(data: $data)");
        expect(request.query).toMatch(SETTINGS_SELECTION);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("throws a validation error of a save with its code, message and data", async () => {
        client.execute.mockResolvedValue({
            workflows: {
                updateSettings: {
                    data: null,
                    error: {
                        code: "Workflows/Settings/Validation",
                        message: "This user is already in the list. Edit it instead.",
                        data: { userId: "user-1" }
                    }
                }
            }
        });

        const promise = gateway.updateSettings(SETTINGS);

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            code: "Workflows/Settings/Validation",
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        });
    });

    describe("errors (R346)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError with the code, message and data of an error envelope",
            async operationCase => {
                const data = { action: "change the workflow settings" };
                client.execute.mockResolvedValue({
                    workflows: {
                        [operationCase.field]: {
                            data: null,
                            error: {
                                code: SettingsErrorCode.NotAuthorized,
                                message: "You are not allowed to change the workflow settings.",
                                data
                            }
                        }
                    }
                });

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: SettingsErrorCode.NotAuthorized,
                    message: "You are not allowed to change the workflow settings.",
                    data
                });
            }
        );

        it.each(operationCases)(
            "$name uses the fallback message for an error without a message",
            async operationCase => {
                client.execute.mockResolvedValue({
                    workflows: {
                        [operationCase.field]: {
                            data: null,
                            error: {
                                code: "Workflows/Settings/Persistence",
                                message: null,
                                data: null
                            }
                        }
                    }
                });

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: "Workflows/Settings/Persistence",
                    message: "The request failed.",
                    data: null
                });
            }
        );

        it.each(operationCases)(
            "$name throws the fallback error when the server answers with neither data nor error",
            async operationCase => {
                client.execute.mockResolvedValue({
                    workflows: { [operationCase.field]: { data: null, error: null } }
                });

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "The request failed.",
                    code: null,
                    data: null
                });
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass as it is",
            async operationCase => {
                const failure = new Error("Network down.");
                client.execute.mockRejectedValue(failure);

                await expect(operationCase.run(gateway)).rejects.toBe(failure);
            }
        );
    });
});
