import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import type { EditorErrorDto } from "~/editor/gateway/dto.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorAppGateway } from "~/editor/testing/fakeWorkflowEditorAppGateway.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import type { FakeWorkflowEditorAppGateway } from "~/editor/testing/fakeWorkflowEditorAppGateway.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
import { WorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
import { WorkflowEditorGateway } from "./WorkflowEditorGateway.js";

type AppGatewayMethod = Exclude<keyof WorkflowEditorAppGateway.Interface, "app">;

interface OperationCase {
    name: AppGatewayMethod;
    run: (gateway: GatewayAbstraction.Interface, app: WorkflowAppKind) => Promise<unknown>;
}

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

const storeParams: StoreWorkflowUseCase.Params = {
    app: "cms",
    data: input,
    savedOn: EDITOR_SAVED_ON
};

const inspectParams: InspectRoutingUseCase.Params = {
    app: "cms",
    stepConfig: {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const operationCases: OperationCase[] = [
    {
        name: "listModels",
        run: (gateway, app) => gateway.listModels({ app, search: "art", limit: 20, after: null })
    },
    {
        name: "getWorkflow",
        run: (gateway, app) => gateway.getWorkflow({ app, id: "workflow-1" })
    },
    {
        name: "storeWorkflow",
        run: (gateway, app) => gateway.storeWorkflow({ app, data: input, savedOn: null })
    },
    {
        name: "deleteWorkflow",
        run: (gateway, app) => gateway.deleteWorkflow({ app, id: "workflow-1" })
    },
    {
        name: "inspectRouting",
        run: (gateway, app) => {
            return gateway.inspectRouting({
                app,
                stepConfig: inspectParams.stepConfig,
                requesterId: "user-1",
                folderId: null,
                modelId: "article"
            });
        }
    },
    {
        name: "folderExists",
        run: (gateway, app) => gateway.folderExists({ app, id: "folder-1", type: "cms:article" })
    }
];

const createGateway = (
    appGateways: FakeWorkflowEditorAppGateway[]
): GatewayAbstraction.Interface => {
    const container = new Container();
    for (const appGateway of appGateways) {
        container.registerInstance(WorkflowEditorAppGateway, appGateway);
    }
    container.register(WorkflowEditorGateway).inSingletonScope();
    return container.resolve(GatewayAbstraction);
};

const conflictError: EditorErrorDto = {
    code: WorkflowErrorCode.Conflict,
    message: "The workflow was changed by Grace Hopper.",
    data: { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { id: "user-2", displayName: "Grace" } }
};

describe("WorkflowEditorGateway", () => {
    describe("routing by app (R347, R348)", () => {
        it.each(operationCases)(
            "$name goes to the CMS gateway for app cms",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const wb = createFakeEditorAppGateway("wb");
                const gateway = createGateway([cms, wb]);

                await operationCase.run(gateway, "cms");

                expect(cms[operationCase.name]).toHaveBeenCalledTimes(1);
                expect(wb[operationCase.name]).not.toHaveBeenCalled();
            }
        );

        it.each(operationCases)("$name goes to the WB gateway for app wb", async operationCase => {
            const cms = createFakeEditorAppGateway("cms");
            const wb = createFakeEditorAppGateway("wb");
            const gateway = createGateway([cms, wb]);

            await operationCase.run(gateway, "wb");

            expect(wb[operationCase.name]).toHaveBeenCalledTimes(1);
            expect(cms[operationCase.name]).not.toHaveBeenCalled();
        });

        it.each(operationCases)(
            "$name throws a plain Error for an app nobody registered and calls no gateway",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const gateway = createGateway([cms]);

                const promise = operationCase.run(gateway, "wb");

                await expect(promise).rejects.toThrow('No workflows app is registered for "wb".');
                await expect(promise).rejects.not.toBeInstanceOf(GraphQLOperationError);
                expect(cms[operationCase.name]).not.toHaveBeenCalled();
            }
        );

        it("uses the first registered gateway of an app registered twice, once (A114)", async () => {
            const first = createFakeEditorAppGateway("cms");
            const second = createFakeEditorAppGateway("cms");
            const firstWorkflow = createEditorWorkflowDto({ id: "workflow-first" });
            first.getWorkflow.mockResolvedValue({ data: firstWorkflow, error: null });
            const gateway = createGateway([first, second]);

            const workflow = await gateway.getWorkflow({ app: "cms", id: "workflow-first" });

            expect(workflow.id).toBe("workflow-first");
            expect(first.getWorkflow).toHaveBeenCalledTimes(1);
            expect(second.getWorkflow).not.toHaveBeenCalled();
        });
    });

    describe("the app gateway receives exactly its old parameters (R347)", () => {
        it("listModels sends search, limit and after without the app", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.listModels({ app: "cms", search: "art", limit: 20, after: "cursor-1" });

            expect(cms.listModels).toHaveBeenCalledWith({
                search: "art",
                limit: 20,
                after: "cursor-1"
            });
        });

        it("getWorkflow and deleteWorkflow send the id alone", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.getWorkflow({ app: "cms", id: "workflow-1" });
            await gateway.deleteWorkflow({ app: "cms", id: "workflow-2" });

            expect(cms.getWorkflow).toHaveBeenCalledWith("workflow-1");
            expect(cms.deleteWorkflow).toHaveBeenCalledWith("workflow-2");
        });

        it("storeWorkflow sends the data and the loaded savedOn string unchanged (D131)", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.storeWorkflow(storeParams);

            expect(cms.storeWorkflow).toHaveBeenCalledWith({
                data: input,
                savedOn: EDITOR_SAVED_ON
            });
            const sent = cms.storeWorkflow.mock.calls[0][0];
            expect(sent.data).toBe(input);
            expect(sent.savedOn).toBe("2026-10-18T09:15:30.123Z");
        });

        it("storeWorkflow sends null for a new workflow", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.storeWorkflow({ app: "cms", data: input, savedOn: null });

            expect(cms.storeWorkflow).toHaveBeenCalledWith({ data: input, savedOn: null });
        });

        it("inspectRouting sends the step config, requester, folder and model", async () => {
            const wb = createFakeEditorAppGateway("wb");
            const gateway = createGateway([wb]);

            await gateway.inspectRouting({ ...inspectParams, app: "wb" });

            expect(wb.inspectRouting).toHaveBeenCalledWith({
                stepConfig: inspectParams.stepConfig,
                requesterId: "user-1",
                folderId: "folder-1",
                modelId: "article"
            });
        });

        it("folderExists sends the id and the folder type", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const gateway = createGateway([cms]);

            await gateway.folderExists({ app: "cms", id: "folder-1", type: "cms:article" });

            expect(cms.folderExists).toHaveBeenCalledWith({ id: "folder-1", type: "cms:article" });
        });
    });

    describe("unwrapping (R346)", () => {
        it("returns the DTOs of the envelope as they are", async () => {
            const cms = createFakeEditorAppGateway("cms");
            const page = createWorkflowModelPageDto();
            const workflow = createEditorWorkflowDto();
            const inspection = createRoutingInspectionDto({ ruleId: "rule-2" });
            cms.listModels.mockResolvedValue({ data: page, error: null });
            cms.getWorkflow.mockResolvedValue({ data: workflow, error: null });
            cms.inspectRouting.mockResolvedValue({ data: inspection, error: null });
            const gateway = createGateway([cms]);

            const listed = await gateway.listModels({
                app: "cms",
                search: "",
                limit: 20,
                after: null
            });
            const loaded = await gateway.getWorkflow({ app: "cms", id: "workflow-1" });
            const inspected = await gateway.inspectRouting(inspectParams);

            expect(listed).toBe(page);
            expect(loaded).toBe(workflow);
            expect(inspected).toBe(inspection);
        });

        it("answers false for a deleted folder and does not throw", async () => {
            const cms = createFakeEditorAppGateway("cms");
            cms.folderExists.mockResolvedValue({ data: false, error: null });
            const gateway = createGateway([cms]);

            const exists = await gateway.folderExists({
                app: "cms",
                id: "folder-1",
                type: "cms:article"
            });

            expect(exists).toBe(false);
        });

        it("throws when the folder answer is missing (undefined), instead of reading it as a deleted folder", async () => {
            const cms = createFakeEditorAppGateway("cms");
            cms.folderExists.mockResolvedValue({ data: undefined, error: null } as never);
            const gateway = createGateway([cms]);

            const promise = gateway.folderExists({
                app: "cms",
                id: "folder-1",
                type: "cms:article"
            });

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({ message: "The request failed." });
        });

        it.each(operationCases)(
            "$name throws a GraphQLOperationError that keeps code, message and data",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const method: Mock = cms[operationCase.name];
                method.mockResolvedValue({
                    data: null,
                    error: {
                        code: WorkflowErrorCode.NotFound,
                        message: "No workflow.",
                        data: { id: "workflow-1" }
                    }
                });
                const gateway = createGateway([cms]);

                const promise = operationCase.run(gateway, "cms");

                await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
                await expect(promise).rejects.toMatchObject({
                    code: WorkflowErrorCode.NotFound,
                    message: "No workflow.",
                    data: { id: "workflow-1" }
                });
            }
        );

        it.each(operationCases)(
            "$name throws the fallback when the server answers with neither data nor error",
            async operationCase => {
                const cms = createFakeEditorAppGateway("cms");
                const method: Mock = cms[operationCase.name];
                method.mockResolvedValue({ data: null, error: null });
                const gateway = createGateway([cms]);

                const promise = operationCase.run(gateway, "cms");

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
                const cms = createFakeEditorAppGateway("cms");
                const failure = new Error("Network down.");
                const method: Mock = cms[operationCase.name];
                method.mockRejectedValue(failure);
                const gateway = createGateway([cms]);

                await expect(operationCase.run(gateway, "cms")).rejects.toBe(failure);
            }
        );

        it("throws a conflict that keeps the code and the savedOn and savedBy of the other save", async () => {
            const cms = createFakeEditorAppGateway("cms");
            cms.storeWorkflow.mockResolvedValue({ data: null, error: conflictError });
            const gateway = createGateway([cms]);

            const promise = gateway.storeWorkflow(storeParams);

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Conflict,
                message: "The workflow was changed by Grace Hopper.",
                data: conflictError.data
            });
        });

        it("throws the validation error of a store with the rule id the server named (R288)", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "r-1"
            };
            const cms = createFakeEditorAppGateway("cms");
            cms.storeWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.Validation,
                    message: "The target team is not one of the step's reviewing teams.",
                    data
                }
            });
            const gateway = createGateway([cms]);

            const promise = gateway.storeWorkflow(storeParams);

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Validation,
                data
            });
        });

        it("throws a blocked delete that keeps the count and the reviews", async () => {
            const data = { count: 2, reviews: [createBlockingReviewDto()] };
            const wb = createFakeEditorAppGateway("wb");
            wb.deleteWorkflow.mockResolvedValue({
                data: null,
                error: {
                    code: WorkflowErrorCode.HasActiveReviews,
                    message: "The workflow has reviews in progress.",
                    data
                }
            });
            const gateway = createGateway([wb]);

            const promise = gateway.deleteWorkflow({ app: "wb", id: "workflow-1" });

            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.HasActiveReviews,
                data
            });
        });
    });
});
