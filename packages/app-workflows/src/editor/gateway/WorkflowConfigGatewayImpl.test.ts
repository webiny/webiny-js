import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { EDITOR_AI_MODEL_FIELDS } from "./editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "./editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "./editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./WorkflowConfigGateway.js";
import { WorkflowConfigGateway } from "./WorkflowConfigGatewayImpl.js";

describe("WorkflowConfigGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WorkflowConfigGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("sends nothing until a method is called", () => {
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("lists the step types on the workflows root without variables", async () => {
        const envelope = { data: [{ type: "review" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listStepTypes: envelope } });

        const result = await gateway.listStepTypes();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("workflows");
        expect(request.query).toContain("listStepTypes");
        expect(request.query).toContain(EDITOR_STEP_TYPE_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
        expect(request.query).not.toContain("listAiModels");
    });

    it("lists the automation definitions without variables", async () => {
        const envelope = { data: [{ id: "automation-1" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listAutomationDefinitions: envelope } });

        const result = await gateway.listAutomationDefinitions();

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAutomationDefinitions");
        expect(request.query).toContain(EDITOR_AUTOMATION_DEFINITION_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("lists the notification transports without variables", async () => {
        const envelope = { data: [{ id: "e-mail" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listNotificationTransports: envelope } });

        const result = await gateway.listNotificationTransports();

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listNotificationTransports");
        expect(request.query).toContain(EDITOR_NOTIFICATION_TRANSPORT_FIELDS);
    });

    it("lists the teams with search, ids and limit as variables", async () => {
        const envelope = { data: { teams: [], missingIds: ["team-9"] }, error: null };
        client.execute.mockResolvedValue({ workflows: { listTeams: envelope } });

        const result = await gateway.listTeams({ search: null, ids: ["team-9"], limit: null });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: ["team-9"], limit: null });
        expect(request.query).toContain("listTeams(search: $search, ids: $ids, limit: $limit)");
        expect(request.query).toContain(EDITOR_TEAM_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("passes a search and a limit of a team lookup through", async () => {
        client.execute.mockResolvedValue({
            workflows: { listTeams: { data: { teams: [], missingIds: [] }, error: null } }
        });

        await gateway.listTeams({ search: "ed", ids: null, limit: 20 });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: "ed", ids: null, limit: 20 });
    });

    it("lists the AI models only when asked", async () => {
        const envelope = { data: [{ id: "openai/gpt-4o" }], error: null };
        client.execute.mockResolvedValue({ workflows: { listAiModels: envelope } });

        const result = await gateway.listAiModels();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiModels");
        expect(request.query).toContain(EDITOR_AI_MODEL_FIELDS);
    });

    it("lists the AI tools without variables", async () => {
        const envelope = { data: [{ name: "readContent", changesContent: false }], error: null };
        client.execute.mockResolvedValue({ workflows: { listAiTools: envelope } });

        const result = await gateway.listAiTools();

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiTools");
        expect(request.query).toContain(EDITOR_AI_TOOL_FIELDS);
        expect(request.query).toContain("changesContent");
    });

    it("returns an error envelope as it is and does not throw (R204)", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/NotAuthorized", message: "No.", data: null }
        };
        client.execute.mockResolvedValue({ workflows: { listAiModels: envelope } });

        const result = await gateway.listAiModels();

        expect(result).toEqual(envelope);
    });

    it("lets a transport failure pass as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);

        await expect(gateway.listStepTypes()).rejects.toBe(failure);
    });
});
