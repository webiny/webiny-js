import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowConfigUseCases as UseCasesAbstraction } from "./abstractions.js";
import { WorkflowConfigUseCases } from "./WorkflowConfigUseCases.js";
import { WorkflowConfigGateway } from "~/editor/gateway/abstractions.js";
import type { IWorkflowConfigGateway } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { ListTeamsParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createAiToolDto } from "~/editor/testing/editorFixtures.js";
import { createAutomationDefinitionDto } from "~/editor/testing/editorFixtures.js";
import { createEditorStepTypeDto } from "~/editor/testing/editorFixtures.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserListDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";

type FakeGateway = { [K in keyof IWorkflowConfigGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listStepTypes: vi.fn(),
        listAutomationDefinitions: vi.fn(),
        listNotificationTransports: vi.fn(),
        listTeams: vi.fn(),
        listUsers: vi.fn(),
        listAiModels: vi.fn(),
        listAiTools: vi.fn()
    };
};

const teamParams: ListTeamsParams = { search: "ed", ids: null, limit: 20 };

const userParams: ListUsersParams = {
    search: "iv",
    ids: null,
    teamIds: ["team-1"],
    limit: 20
};

interface OperationCase {
    name: string;
    method: keyof IWorkflowConfigGateway;
    run: (useCases: UseCasesAbstraction.Interface) => Promise<unknown>;
}

const operationCases: OperationCase[] = [
    { name: "listStepTypes", method: "listStepTypes", run: useCases => useCases.listStepTypes() },
    {
        name: "listAutomationDefinitions",
        method: "listAutomationDefinitions",
        run: useCases => useCases.listAutomationDefinitions()
    },
    {
        name: "listNotificationTransports",
        method: "listNotificationTransports",
        run: useCases => useCases.listNotificationTransports()
    },
    { name: "listTeams", method: "listTeams", run: useCases => useCases.listTeams(teamParams) },
    { name: "listUsers", method: "listUsers", run: useCases => useCases.listUsers(userParams) },
    { name: "listAiModels", method: "listAiModels", run: useCases => useCases.listAiModels() },
    { name: "listAiTools", method: "listAiTools", run: useCases => useCases.listAiTools() }
];

describe("WorkflowConfigUseCases", () => {
    let gateway: FakeGateway;
    let useCases: UseCasesAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeGateway();
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigUseCases).inSingletonScope();
        useCases = container.resolve(UseCasesAbstraction);
    });

    it("lists the step types in the order the server returns them and narrows the schema", async () => {
        const configSchema = { type: "object", properties: { teams: { type: "array" } } };
        gateway.listStepTypes.mockResolvedValue({
            data: [
                createEditorStepTypeDto({ type: "ai", title: "AI", configSchema: null }),
                createEditorStepTypeDto({ type: "review", configSchema }),
                createEditorStepTypeDto({
                    type: "automation",
                    available: false,
                    unavailableReason: "No automations are available."
                })
            ],
            error: null
        });

        const stepTypes = await useCases.listStepTypes();

        expect(stepTypes.map(stepType => stepType.type)).toEqual(["ai", "review", "automation"]);
        expect(stepTypes[1].configSchema).toBe(configSchema);
        expect(stepTypes[0].configSchema).toBeNull();
        expect(stepTypes[2].unavailableReason).toBe("No automations are available.");
    });

    it("lists the automation definitions and narrows the settings schema", async () => {
        const settingsSchema = { type: "object", properties: { timeout: { type: "number" } } };
        gateway.listAutomationDefinitions.mockResolvedValue({
            data: [
                createAutomationDefinitionDto({ id: "automation-1", settingsSchema }),
                createAutomationDefinitionDto({ id: "automation-2", settingsSchema: null })
            ],
            error: null
        });

        const definitions = await useCases.listAutomationDefinitions();

        expect(definitions.map(definition => definition.id)).toEqual([
            "automation-1",
            "automation-2"
        ]);
        expect(definitions[0].settingsSchema).toBe(settingsSchema);
        expect(definitions[1].settingsSchema).toBeNull();
    });

    it("lists the notification transports as they are", async () => {
        const transports = [
            createNotificationTransport(),
            createNotificationTransport({ id: "slack", title: "Slack", description: "Posts." })
        ];
        gateway.listNotificationTransports.mockResolvedValue({ data: transports, error: null });

        const result = await useCases.listNotificationTransports();

        expect(result).toEqual(transports);
    });

    it("lists the teams with the params passed through and the missing ids", async () => {
        gateway.listTeams.mockResolvedValue({
            data: {
                teams: [createWorkflowTeamSummary({ memberCount: 0 })],
                missingIds: ["team-gone"]
            },
            error: null
        });

        const result = await useCases.listTeams(teamParams);

        expect(gateway.listTeams).toHaveBeenCalledWith(teamParams);
        expect(result.teams[0].memberCount).toBe(0);
        expect(result.missingIds).toEqual(["team-gone"]);
    });

    it("lists the users with the params passed through, the team ids and the missing ids", async () => {
        gateway.listUsers.mockResolvedValue({
            data: createWorkflowUserListDto({
                users: [
                    createWorkflowUserDto({ id: "user-1", teamIds: ["team-1", "team-2"] }),
                    createWorkflowUserDto({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
                ],
                missingIds: ["user-gone"]
            }),
            error: null
        });

        const result = await useCases.listUsers(userParams);

        expect(gateway.listUsers).toHaveBeenCalledWith(userParams);
        expect(result.users).toEqual([
            createWorkflowUserSummary({ id: "user-1", teamIds: ["team-1", "team-2"] }),
            createWorkflowUserSummary({ id: "user-2", displayName: "Maja Kos", teamIds: [] })
        ]);
        expect(result.missingIds).toEqual(["user-gone"]);
    });

    it("lists the AI models as they are and the AI tools mapped with changesContent, only when called", async () => {
        gateway.listAiModels.mockResolvedValue({ data: [createAiModel()], error: null });
        gateway.listAiTools.mockResolvedValue({
            data: [createAiToolDto({ changesContent: true })],
            error: null
        });

        expect(gateway.listAiModels).not.toHaveBeenCalled();
        expect(gateway.listAiTools).not.toHaveBeenCalled();

        const models = await useCases.listAiModels();
        const tools = await useCases.listAiTools();

        expect(models).toEqual([createAiModel()]);
        expect(tools).toEqual([createAiTool({ changesContent: true })]);
        expect(gateway.listAiModels).toHaveBeenCalledTimes(1);
        expect(gateway.listAiTools).toHaveBeenCalledTimes(1);
    });

    it("returns an empty list as an empty list", async () => {
        gateway.listAiModels.mockResolvedValue({ data: [], error: null });

        expect(await useCases.listAiModels()).toEqual([]);
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(WorkflowConfigGateway, gateway);
        container.register(WorkflowConfigUseCases).inSingletonScope();

        expect(container.resolve(UseCasesAbstraction)).toBe(container.resolve(UseCasesAbstraction));
    });

    describe("error mapping (R204)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError for an error envelope",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({
                    data: null,
                    error: {
                        code: WorkflowErrorCode.NotAuthorized,
                        message: "Not authorized.",
                        data: { action: "list" }
                    }
                });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: WorkflowErrorCode.NotAuthorized,
                    message: "Not authorized.",
                    data: { action: "list" }
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
