import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorUseCases } from "./WorkflowEditorUseCases.js";
import type { IWorkflowEditorUseCases } from "./IWorkflowEditorUseCases.js";
import type { FolderExistsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { IWorkflowEditorGateway } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { ListWorkflowModelsParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { StoreWorkflowParams } from "~/editor/gateway/IWorkflowEditorGateway.js";
import type { EditorErrorDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "~/editor/testing/editorFixtures.js";

type FakeGateway = { [K in keyof IWorkflowEditorGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listModels: vi.fn(),
        getWorkflow: vi.fn(),
        storeWorkflow: vi.fn(),
        deleteWorkflow: vi.fn(),
        inspectRouting: vi.fn(),
        folderExists: vi.fn()
    };
};

const inspectParams: InspectRoutingParams = {
    stepConfig: {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const folderParams: FolderExistsParams = { id: "folder-1", type: "cms:article" };

const listParams: ListWorkflowModelsParams = { search: "art", limit: 20, after: "cursor-1" };

const input: EditorWorkflowInput = {
    id: "workflow-1",
    name: "Article review",
    models: ["cms.article"],
    steps: [
        {
            id: "step-1",
            title: "Editorial check",
            color: "var(--color-primary-500)",
            description: null,
            type: "review",
            notifications: [{ id: "e-mail" }],
            config: { teams: ["team-1"] }
        }
    ]
};

const storeParams: StoreWorkflowParams = { data: input, savedOn: EDITOR_SAVED_ON };

const conflictError: EditorErrorDto = {
    code: WorkflowErrorCode.Conflict,
    message: "The workflow was changed by Grace Hopper.",
    data: { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { id: "user-2", displayName: "Grace" } }
};

interface OperationCase {
    name: string;
    method: keyof IWorkflowEditorGateway;
    run: (useCases: WorkflowEditorUseCases) => Promise<unknown>;
}

const operationCases: OperationCase[] = [
    { name: "listModels", method: "listModels", run: useCases => useCases.listModels(listParams) },
    {
        name: "getWorkflow",
        method: "getWorkflow",
        run: useCases => useCases.getWorkflow("workflow-1")
    },
    {
        name: "storeWorkflow",
        method: "storeWorkflow",
        run: useCases => useCases.storeWorkflow(storeParams)
    },
    {
        name: "deleteWorkflow",
        method: "deleteWorkflow",
        run: useCases => useCases.deleteWorkflow("workflow-1")
    },
    {
        name: "inspectRouting",
        method: "inspectRouting",
        run: useCases => useCases.inspectRouting(inspectParams)
    },
    {
        name: "folderExists",
        method: "folderExists",
        run: useCases => useCases.folderExists(folderParams)
    }
];

describe("WorkflowEditorUseCases", () => {
    let gateway: FakeGateway;
    let useCases: WorkflowEditorUseCases;

    beforeEach(() => {
        gateway = createFakeGateway();
        useCases = new WorkflowEditorUseCases(gateway);
    });

    describe("listModels", () => {
        it("passes the params untouched and maps the rows with the page meta", async () => {
            gateway.listModels.mockResolvedValue({
                data: createWorkflowModelPageDto({
                    rows: [
                        createWorkflowModelRowDto(),
                        createWorkflowModelRowDto({
                            model: "cms.author",
                            modelId: "author",
                            name: "Author",
                            workflow: null
                        })
                    ],
                    meta: { cursor: "cursor-2", hasMoreItems: true }
                }),
                error: null
            });

            const page = await useCases.listModels(listParams);

            expect(gateway.listModels).toHaveBeenCalledWith(listParams);
            expect(page.cursor).toBe("cursor-2");
            expect(page.hasMoreItems).toBe(true);
            expect(page.rows.map(row => row.model)).toEqual(["cms.article", "cms.author"]);
            expect(page.rows[1].workflow).toBeNull();
        });
    });

    describe("getWorkflow", () => {
        it("passes the id and maps the workflow", async () => {
            gateway.getWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            const workflow = await useCases.getWorkflow("workflow-1");

            expect(gateway.getWorkflow).toHaveBeenCalledWith("workflow-1");
            expect(workflow).toEqual(createEditorWorkflow());
        });
    });

    describe("storeWorkflow", () => {
        it("sends the data and the loaded savedOn string unchanged (D131)", async () => {
            gateway.storeWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            await useCases.storeWorkflow(storeParams);

            expect(gateway.storeWorkflow).toHaveBeenCalledTimes(1);
            const sent: StoreWorkflowParams = gateway.storeWorkflow.mock.calls[0][0];
            expect(sent).toBe(storeParams);
            expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
        });

        it("sends null for a new workflow", async () => {
            gateway.storeWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            await useCases.storeWorkflow({ data: input, savedOn: null });

            const sent: StoreWorkflowParams = gateway.storeWorkflow.mock.calls[0][0];
            expect(sent.savedOn).toBeNull();
        });

        it("returns the stored workflow with the new savedOn string unchanged", async () => {
            gateway.storeWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto({ savedOn: "2026-10-18T11:30:00.456Z" }),
                error: null
            });

            const workflow = await useCases.storeWorkflow(storeParams);

            expect(workflow.savedOn).toBe("2026-10-18T11:30:00.456Z");
        });

        it("throws a conflict that keeps the code and the savedOn and savedBy of the other save", async () => {
            gateway.storeWorkflow.mockResolvedValue({ data: null, error: conflictError });

            const promise = useCases.storeWorkflow(storeParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Conflict,
                message: "The workflow was changed by Grace Hopper.",
                data: conflictError.data
            });
        });

        it("throws the validation error with the rule id the server named (R288)", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "r-1"
            };
            gateway.storeWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "The target team is not one of the step's reviewing teams.",
                    data
                }
            });

            const promise = useCases.storeWorkflow(storeParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({ data });
        });

        it("throws a validation error that keeps the step and the field", async () => {
            const data = { stepId: "step-1", field: "config.teams", workflowId: null };
            gateway.storeWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "Step needs a team.",
                    data
                }
            });

            const promise = useCases.storeWorkflow(storeParams);

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Validation,
                data
            });
        });
    });

    describe("deleteWorkflow", () => {
        it("passes the id and maps the deleted workflow", async () => {
            gateway.deleteWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto(),
                error: null
            });

            const workflow = await useCases.deleteWorkflow("workflow-1");

            expect(gateway.deleteWorkflow).toHaveBeenCalledWith("workflow-1");
            expect(workflow.id).toBe("workflow-1");
        });

        it("throws a blocked delete that keeps the count and the reviews", async () => {
            const data = {
                count: 2,
                reviews: [{ reviewId: "review-1", title: "Spring campaign" }]
            };
            gateway.deleteWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.HasActiveReviews,
                    message: "The workflow has reviews in progress.",
                    data
                }
            });

            const promise = useCases.deleteWorkflow("workflow-1");

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.HasActiveReviews,
                data
            });
        });
    });

    describe("inspectRouting", () => {
        it("passes the params untouched and maps the inspection", async () => {
            gateway.inspectRouting.mockResolvedValue({
                data: createRoutingInspectionDto({
                    narrowedTeamId: "team-2",
                    candidateIds: ["user-3", "user-4"],
                    candidateCount: 5,
                    trace: [
                        {
                            ruleId: "rule-1",
                            outcome: "notMatched",
                            reason: null,
                            failedConditions: ["folder"]
                        },
                        {
                            ruleId: "rule-2",
                            outcome: "notEvaluated",
                            reason: null,
                            failedConditions: []
                        }
                    ]
                }),
                error: null
            });

            const inspection = await useCases.inspectRouting(inspectParams);

            expect(gateway.inspectRouting).toHaveBeenCalledWith(inspectParams);
            const sent: InspectRoutingParams = gateway.inspectRouting.mock.calls[0][0];
            expect(sent).toBe(inspectParams);
            expect(inspection).toEqual(
                createRoutingInspection({
                    narrowedTeamId: "team-2",
                    candidateIds: ["user-3", "user-4"],
                    candidateCount: 5,
                    trace: [
                        {
                            ruleId: "rule-1",
                            outcome: "notMatched",
                            reason: null,
                            failedConditions: ["folder"]
                        },
                        {
                            ruleId: "rule-2",
                            outcome: "notEvaluated",
                            reason: null,
                            failedConditions: []
                        }
                    ]
                })
            );
        });

        it("throws a validation error that keeps the rule, the step and the field", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                ruleId: "rule-1",
                workflowId: null
            };
            gateway.inspectRouting.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "The target team is not one of the step's reviewing teams.",
                    data
                }
            });

            const promise = useCases.inspectRouting(inspectParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Validation,
                message: "The target team is not one of the step's reviewing teams.",
                data
            });
        });
    });

    describe("folderExists", () => {
        it("passes the params untouched and answers true for a folder that exists", async () => {
            gateway.folderExists.mockResolvedValue({ data: true, error: null });

            const exists = await useCases.folderExists(folderParams);

            expect(gateway.folderExists).toHaveBeenCalledWith(folderParams);
            expect(exists).toBe(true);
        });

        it("answers false for a deleted folder and does not throw", async () => {
            gateway.folderExists.mockResolvedValue({ data: false, error: null });

            const exists = await useCases.folderExists(folderParams);

            expect(exists).toBe(false);
        });
    });

    describe("error mapping (R204)", () => {
        it.each(operationCases)(
            "$name throws a GraphQLOperationError for an error envelope",
            async operationCase => {
                gateway[operationCase.method].mockResolvedValue({
                    data: null,
                    error: {
                        code: WorkflowErrorCode.NotFound,
                        message: "No workflow.",
                        data: { id: "workflow-1" }
                    }
                });

                const promise = operationCase.run(useCases);

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: WorkflowErrorCode.NotFound,
                    message: "No workflow.",
                    data: { id: "workflow-1" }
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

    describe("per-app subclasses (one container, two apps)", () => {
        const GatewayA = createAbstraction<IWorkflowEditorGateway>("Test/EditorGatewayA");
        const GatewayB = createAbstraction<IWorkflowEditorGateway>("Test/EditorGatewayB");
        const UseCasesA = createAbstraction<IWorkflowEditorUseCases>("Test/EditorUseCasesA");
        const UseCasesB = createAbstraction<IWorkflowEditorUseCases>("Test/EditorUseCasesB");

        class UseCasesAImpl extends WorkflowEditorUseCases implements IWorkflowEditorUseCases {}
        class UseCasesBImpl extends WorkflowEditorUseCases implements IWorkflowEditorUseCases {}

        const BoundA = UseCasesA.createImplementation({
            implementation: UseCasesAImpl,
            dependencies: [GatewayA]
        });
        const BoundB = UseCasesB.createImplementation({
            implementation: UseCasesBImpl,
            dependencies: [GatewayB]
        });

        it("binds each subclass to its own gateway with its own instance", async () => {
            const gatewayA = createFakeGateway();
            const gatewayB = createFakeGateway();
            gatewayA.getWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto({ id: "workflow-a" }),
                error: null
            });
            gatewayB.getWorkflow.mockResolvedValue({
                data: createEditorWorkflowDto({ id: "workflow-b" }),
                error: null
            });
            const container = new Container();
            container.registerInstance(GatewayA, gatewayA);
            container.registerInstance(GatewayB, gatewayB);
            container.register(BoundA).inSingletonScope();
            container.register(BoundB).inSingletonScope();

            const a = container.resolve(UseCasesA);
            const b = container.resolve(UseCasesB);
            const workflowA = await a.getWorkflow("workflow-a");
            const workflowB = await b.getWorkflow("workflow-b");

            expect(a).not.toBe(b);
            expect(container.resolve(UseCasesA)).toBe(a);
            expect(workflowA.id).toBe("workflow-a");
            expect(workflowB.id).toBe("workflow-b");
            expect(gatewayA.getWorkflow).toHaveBeenCalledTimes(1);
            expect(gatewayB.getWorkflow).toHaveBeenCalledTimes(1);
        });

        it("runs inspectRouting and folderExists of each subclass through its own gateway", async () => {
            const gatewayA = createFakeGateway();
            const gatewayB = createFakeGateway();
            gatewayA.inspectRouting.mockResolvedValue({
                data: createRoutingInspectionDto({ ruleId: "rule-a" }),
                error: null
            });
            gatewayB.inspectRouting.mockResolvedValue({
                data: createRoutingInspectionDto({ ruleId: "rule-b" }),
                error: null
            });
            gatewayA.folderExists.mockResolvedValue({ data: true, error: null });
            gatewayB.folderExists.mockResolvedValue({ data: false, error: null });
            const container = new Container();
            container.registerInstance(GatewayA, gatewayA);
            container.registerInstance(GatewayB, gatewayB);
            container.register(BoundA).inSingletonScope();
            container.register(BoundB).inSingletonScope();

            const a = container.resolve(UseCasesA);
            const b = container.resolve(UseCasesB);
            const inspectionA = await a.inspectRouting(inspectParams);
            const inspectionB = await b.inspectRouting(inspectParams);
            const existsA = await a.folderExists(folderParams);
            const existsB = await b.folderExists(folderParams);

            expect(inspectionA.ruleId).toBe("rule-a");
            expect(inspectionB.ruleId).toBe("rule-b");
            expect(existsA).toBe(true);
            expect(existsB).toBe(false);
            expect(gatewayA.inspectRouting).toHaveBeenCalledTimes(1);
            expect(gatewayB.inspectRouting).toHaveBeenCalledTimes(1);
            expect(gatewayA.folderExists).toHaveBeenCalledTimes(1);
            expect(gatewayB.folderExists).toHaveBeenCalledTimes(1);
        });

        it("the shared class carries no abstraction metadata, so it cannot be registered as is (R237)", () => {
            const container = new Container();

            expect(() => container.register(WorkflowEditorUseCases)).toThrow(
                "No abstraction metadata found"
            );
        });
    });
});
