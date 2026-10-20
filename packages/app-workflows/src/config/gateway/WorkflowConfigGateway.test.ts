import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { EDITOR_AI_MODEL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import { EDITOR_USER_LIST_FIELDS } from "~/editor/gateway/editorFields.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { WorkflowConfigGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowConfigGateway } from "./WorkflowConfigGateway.js";

interface OperationCase {
    // The method name, which is also the field on the `workflows` root.
    name: string;
    run: (gateway: GatewayAbstraction.Interface) => Promise<unknown>;
}

interface WorkflowsResponse {
    workflows: Record<string, unknown>;
}

const respond = (field: string, envelope: unknown): WorkflowsResponse => {
    return { workflows: { [field]: envelope } };
};

const operationCases: OperationCase[] = [
    { name: "listStepTypes", run: gateway => gateway.listStepTypes() },
    { name: "listAutomationDefinitions", run: gateway => gateway.listAutomationDefinitions() },
    { name: "listNotificationTransports", run: gateway => gateway.listNotificationTransports() },
    {
        name: "listTeams",
        run: gateway => gateway.listTeams({ search: null, ids: null, limit: null })
    },
    {
        name: "listUsers",
        run: gateway => gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null })
    },
    { name: "listAiModels", run: gateway => gateway.listAiModels() },
    { name: "listAiTools", run: gateway => gateway.listAiTools() }
];

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

    it("lists the step types on the workflows root without variables and returns the data", async () => {
        const envelope = { data: [{ type: "review" }], error: null };
        const response = respond("listStepTypes", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listStepTypes();

        expect(result).toEqual(envelope.data);
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
        const response = respond("listAutomationDefinitions", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAutomationDefinitions();

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAutomationDefinitions");
        expect(request.query).toContain(EDITOR_AUTOMATION_DEFINITION_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("lists the notification transports without variables", async () => {
        const envelope = { data: [{ id: "e-mail" }], error: null };
        const response = respond("listNotificationTransports", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listNotificationTransports();

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listNotificationTransports");
        expect(request.query).toContain(EDITOR_NOTIFICATION_TRANSPORT_FIELDS);
    });

    it("lists the teams with search, ids and limit as variables", async () => {
        const envelope = { data: { teams: [], missingIds: ["team-9"] }, error: null };
        const response = respond("listTeams", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listTeams({ search: null, ids: ["team-9"], limit: null });

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: ["team-9"], limit: null });
        expect(request.query).toContain("listTeams(search: $search, ids: $ids, limit: $limit)");
        expect(request.query).toContain(EDITOR_TEAM_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("passes a search and a limit of a team lookup through", async () => {
        const envelope = { data: { teams: [], missingIds: [] }, error: null };
        const response = respond("listTeams", envelope);
        client.execute.mockResolvedValue(response);

        await gateway.listTeams({ search: "ed", ids: null, limit: 20 });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: "ed", ids: null, limit: 20 });
    });

    it("lists the users with search, ids, team ids and limit as variables", async () => {
        const envelope = {
            data: {
                users: [{ id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] }],
                missingIds: ["user-9"]
            },
            error: null
        };
        const response = respond("listUsers", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listUsers({
            search: "iv",
            ids: ["user-1", "user-9"],
            teamIds: ["team-1"],
            limit: 20
        });

        expect(result).toEqual(envelope.data);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            search: "iv",
            ids: ["user-1", "user-9"],
            teamIds: ["team-1"],
            limit: 20
        });
        expect(request.query).toContain("workflows");
        expect(request.query).toContain(
            "listUsers(search: $search, ids: $ids, teamIds: $teamIds, limit: $limit)"
        );
        expect(request.query).toContain(EDITOR_USER_LIST_FIELDS);
        expect(request.query).toContain(ERROR_FIELDS);
    });

    it("sends null for every variable a user lookup does not set", async () => {
        const envelope = { data: { users: [], missingIds: [] }, error: null };
        const response = respond("listUsers", envelope);
        client.execute.mockResolvedValue(response);

        await gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null });

        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ search: null, ids: null, teamIds: null, limit: null });
    });

    it("lists the AI models only when asked (R275)", async () => {
        const envelope = { data: [{ id: "openai/gpt-4o" }], error: null };
        const response = respond("listAiModels", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAiModels();

        expect(result).toEqual(envelope.data);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiModels");
        expect(request.query).toContain(EDITOR_AI_MODEL_FIELDS);
    });

    it("lists the AI tools without variables", async () => {
        const envelope = { data: [{ name: "readContent", changesContent: false }], error: null };
        const response = respond("listAiTools", envelope);
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAiTools();

        expect(result).toEqual(envelope.data);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listAiTools");
        expect(request.query).toContain(EDITOR_AI_TOOL_FIELDS);
        expect(request.query).toContain("changesContent");
    });

    it("returns an empty list as a value, not as missing data", async () => {
        const response = respond("listAiModels", { data: [], error: null });
        client.execute.mockResolvedValue(response);

        const result = await gateway.listAiModels();

        expect(result).toEqual([]);
    });

    it("uses the fallback message and keeps the code of an error without a message", async () => {
        const error = { code: WorkflowErrorCode.NotAuthorized, message: null, data: null };
        const response = respond("listUsers", { data: null, error });
        client.execute.mockResolvedValue(response);

        const promise = gateway.listUsers({ search: null, ids: null, teamIds: null, limit: null });

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            message: "The request failed.",
            code: WorkflowErrorCode.NotAuthorized,
            data: null
        });
    });

    describe("errors (R346)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError with the message, code and data of an error envelope",
            async operationCase => {
                const error = {
                    code: WorkflowErrorCode.NotAuthorized,
                    message: "Not authorized.",
                    data: { action: "list" }
                };
                const response = respond(operationCase.name, { data: null, error });
                client.execute.mockResolvedValue(response);

                const promise = operationCase.run(gateway);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    message: "Not authorized.",
                    code: WorkflowErrorCode.NotAuthorized,
                    data: { action: "list" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws the fallback error when the server answers with neither data nor error",
            async operationCase => {
                const response = respond(operationCase.name, { data: null, error: null });
                client.execute.mockResolvedValue(response);

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
