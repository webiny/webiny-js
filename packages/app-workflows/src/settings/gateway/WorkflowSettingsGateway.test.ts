import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import type { WorkflowSettingsDto } from "./dto.js";
import { SETTINGS_FIELDS } from "./settingsFields.js";
import { WorkflowSettingsGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowSettingsGateway } from "./WorkflowSettingsGateway.js";

const SETTINGS: WorkflowSettingsDto = {
    exclusions: [
        { userId: "user-1", reason: "On leave", endsOn: "2026-10-20T21:59:59.999Z" },
        { userId: "user-2", reason: null, endsOn: null }
    ]
};

describe("WorkflowSettingsGateway", () => {
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
        const envelope = { data: SETTINGS, error: null };
        client.execute.mockResolvedValue({ workflows: { getSettings: envelope } });

        const result = await gateway.getSettings({ includeExpired: true });

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ includeExpired: true });
        expect(request.query).toContain("query GetWorkflowSettings($includeExpired: Boolean)");
        expect(request.query).toContain("workflows");
        expect(request.query).toContain("getSettings(includeExpired: $includeExpired)");
        expect(request.query).toContain(SETTINGS_FIELDS);
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
        const envelope = { data: SETTINGS, error: null };
        client.execute.mockResolvedValue({ workflows: { updateSettings: envelope } });

        const result = await gateway.updateSettings(SETTINGS);

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ data: SETTINGS });
        expect(request.query).toContain(
            "mutation UpdateWorkflowSettings($data: WorkflowsSettingsInput!)"
        );
        expect(request.query).toContain("updateSettings(data: $data)");
        expect(request.query).toContain(SETTINGS_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("sends a null reason and a null end date as null", async () => {
        client.execute.mockResolvedValue({
            workflows: { updateSettings: { data: SETTINGS, error: null } }
        });

        await gateway.updateSettings(SETTINGS);

        const request = client.execute.mock.calls[0][0];
        expect(request.variables.data.exclusions[1]).toEqual({
            userId: "user-2",
            reason: null,
            endsOn: null
        });
    });

    it("returns a server error of a read as an envelope and does not throw (R204)", async () => {
        const error = {
            code: "Workflows/NotAuthorized",
            message: "You are not allowed to view the workflow settings.",
            data: { action: "view the workflow settings" }
        };
        client.execute.mockResolvedValue({ workflows: { getSettings: { data: null, error } } });

        const result = await gateway.getSettings({ includeExpired: true });

        expect(result).toEqual({ data: null, error });
    });

    it("returns a server error of a save as an envelope and does not throw (R204)", async () => {
        const error = {
            code: "Workflows/Settings/Validation",
            message: "This user is already in the list. Edit it instead.",
            data: { userId: "user-1" }
        };
        client.execute.mockResolvedValue({ workflows: { updateSettings: { data: null, error } } });

        const result = await gateway.updateSettings(SETTINGS);

        expect(result).toEqual({ data: null, error });
    });

    it("lets a transport failure of a read pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(gateway.getSettings({ includeExpired: true })).rejects.toBe(failure);
    });

    it("lets a transport failure of a save pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(gateway.updateSettings(SETTINGS)).rejects.toBe(failure);
    });
});
