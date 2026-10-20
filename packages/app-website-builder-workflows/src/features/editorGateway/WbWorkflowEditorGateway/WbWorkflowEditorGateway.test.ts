import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import type { EditorWorkflowInput } from "@webiny/app-workflows/editor/domain/types.js";
import type { FolderExistsParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/appGateway/IWorkflowEditorAppGateway.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { WbWorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway.js";

const input: EditorWorkflowInput = {
    id: "workflow-1",
    name: "Page review",
    models: ["wb.page"],
    steps: [
        {
            id: "step-1",
            title: "Legal",
            color: "var(--color-primary-500)",
            description: null,
            type: "review",
            notifications: [{ id: "e-mail" }],
            config: { teams: ["team-1"] }
        }
    ]
};

const inspectParams: InspectRoutingParams = {
    stepConfig: {
        teams: ["team-1"],
        assignment: {
            strategy: "leastLoaded",
            allowManualPick: false,
            rules: [{ id: "rule-1", conditions: {}, target: { type: "team", id: "team-1" } }]
        }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "page"
};

const folderParams: FolderExistsParams = { id: "folder-1", type: "wb:page" };

describe("WbWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WbWorkflowEditorGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    describe("listModels", () => {
        it("answers the single Pages row with the workflow that binds wb.page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [
                            { id: "workflow-other", name: "Other", models: ["cms.article"] },
                            { id: "workflow-1", name: "Page review", models: ["wb.page"] }
                        ],
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({
                data: {
                    rows: [
                        {
                            model: "wb.page",
                            modelId: "page",
                            name: "Pages",
                            workflow: { id: "workflow-1", name: "Page review" }
                        }
                    ],
                    meta: { cursor: null, hasMoreItems: false }
                },
                error: null
            });
        });

        it("answers the row without a workflow when no workflow binds wb.page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [{ id: "workflow-other", name: "Other", models: ["cms.article"] }],
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result.data?.rows).toEqual([
                { model: "wb.page", modelId: "page", name: "Pages", workflow: null }
            ]);
        });

        it("answers the row without a workflow for an empty list", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result.data?.rows[0].workflow).toBeNull();
            expect(result.error).toBeNull();
        });

        it("takes the first workflow that binds wb.page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [
                            { id: "workflow-1", name: "First", models: ["wb.page"] },
                            { id: "workflow-2", name: "Second", models: ["wb.page"] }
                        ],
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result.data?.rows[0].workflow).toEqual({ id: "workflow-1", name: "First" });
        });

        it("ignores search, limit and after: one request, no variables, one last page", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
            });

            const result = await gateway.listModels({ search: "zzz", limit: 5, after: "cursor-9" });

            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toBeUndefined();
            expect(request.query).toContain("websiteBuilder");
            expect(request.query).toContain("listWebsiteBuilderPageWorkflows");
            expect(request.query).toMatch(/id\s+name\s+models/);
            expect(request.query).toContain(ERROR_FIELDS);
            expect(result.data?.rows).toHaveLength(1);
            expect(result.data?.meta).toEqual({ cursor: null, hasMoreItems: false });
        });

        it("answers an error envelope without data and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: null, error } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error });
        });

        it("answers neither data nor error when the server sends neither", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: null, error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error: null });
        });

        it("returns a validation envelope with the rule id as it is (R288)", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/Validation",
                    message: "The target team is not one of the step's reviewing teams.",
                    data: {
                        stepId: "step-1",
                        field: "config.assignment.rules.target",
                        workflowId: null,
                        ruleId: "r-1"
                    }
                }
            };
            client.execute.mockResolvedValue({
                websiteBuilder: { storeWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
            expect(result.error?.data).toMatchObject({ ruleId: "r-1" });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.listModels({ search: "", limit: 20, after: null })).rejects.toBe(
                failure
            );
        });
    });

    describe("getWorkflow", () => {
        it("reads the page workflow by id and returns the envelope as it is", async () => {
            const envelope = {
                data: createEditorWorkflowDto({ models: ["wb.page"] }),
                error: null
            };
            client.execute.mockResolvedValue({
                websiteBuilder: { getWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.getWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("websiteBuilder");
            expect(request.query).toContain("getWebsiteBuilderPageWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });
    });

    describe("storeWorkflow", () => {
        it("sends the data and the loaded savedOn string unchanged (D131)", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { storeWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: "2026-10-18T09:15:30.123Z" });
            expect(request.variables.data).toBe(input);
            expect(request.query).toContain("mutation");
            expect(request.query).toContain(
                "storeWebsiteBuilderPageWorkflow(data: $data, savedOn: $savedOn)"
            );
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null savedOn for a new workflow", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    storeWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto(),
                        error: null
                    }
                }
            });

            await gateway.storeWorkflow({ data: input, savedOn: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: null });
        });

        it("returns a conflict envelope as it is and does not throw (R204)", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/Conflict",
                    message: "The workflow was changed.",
                    data: { savedOn: "2026-10-18T10:00:00.000Z" }
                }
            };
            client.execute.mockResolvedValue({
                websiteBuilder: { storeWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(
                gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON })
            ).rejects.toBe(failure);
        });
    });

    describe("inspectRouting", () => {
        it("sends the step config, the requester and the folder and ignores the model id", async () => {
            const envelope = { data: createRoutingInspectionDto(), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { inspectWebsiteBuilderPageRouting: envelope }
            });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual(envelope);
            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({
                stepConfig: inspectParams.stepConfig,
                requesterId: "user-1",
                folderId: "folder-1"
            });
            expect(request.query).toContain("query InspectWebsiteBuilderPageRouting");
            expect(request.query).toContain("websiteBuilder");
            expect(request.query).toContain(
                "inspectWebsiteBuilderPageRouting(stepConfig: $stepConfig, requesterId: $requesterId, folderId: $folderId)"
            );
            expect(request.query).toContain("$stepConfig: JSON!");
            expect(request.query).toContain("$requesterId: ID!");
            expect(request.query).toContain("$folderId: ID");
            expect(request.query).not.toContain("modelId");
            expect(request.query).toContain(EDITOR_ROUTING_INSPECTION_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null folder as the root", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    inspectWebsiteBuilderPageRouting: {
                        data: createRoutingInspectionDto(),
                        error: null
                    }
                }
            });

            await gateway.inspectRouting({ ...inspectParams, folderId: null, modelId: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables.folderId).toBeNull();
            expect(request.variables).not.toHaveProperty("modelId");
        });

        it("selects every field of the extended inspection (R289)", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    inspectWebsiteBuilderPageRouting: {
                        data: createRoutingInspectionDto(),
                        error: null
                    }
                }
            });

            await gateway.inspectRouting(inspectParams);

            const query: string = client.execute.mock.calls[0][0].query;
            expect(query).toMatch(/narrowedTeamId\s+candidateIds\s+candidateCount/);
            expect(query).toMatch(/trace\s*\{\s*ruleId\s+outcome\s+reason\s+failedConditions\s*\}/);
            expect(query).toMatch(/skipped\s*\{\s*userId\s+displayName\s+reason\s*\}/);
        });

        it("returns a validation error of a rule as an envelope and does not throw (R204)", async () => {
            const error = {
                code: "Workflows/Workflow/Validation",
                message: "The target user is not a member of the step's teams.",
                data: {
                    stepId: "step-1",
                    field: "config.assignment.rules.target",
                    ruleId: "rule-1",
                    workflowId: null
                }
            };
            client.execute.mockResolvedValue({
                websiteBuilder: { inspectWebsiteBuilderPageRouting: { data: null, error } }
            });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual({ data: null, error });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.inspectRouting(inspectParams)).rejects.toBe(failure);
        });
    });

    describe("folderExists", () => {
        it("sends the folder id only and ignores the folder type", async () => {
            const envelope = { data: true, error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: envelope }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "folder-1" });
            expect(request.query).toContain("query WebsiteBuilderPageFolderExists");
            expect(request.query).toContain("websiteBuilderPageFolderExists(id: $id)");
            expect(request.query).toContain("$id: ID!");
            expect(request.query).not.toContain("$type");
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("returns false as an answer, not an error", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: { data: false, error: null } }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: false, error: null });
        });

        it("returns a server error as an envelope and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: { data: null, error } }
            });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: null, error });
        });

        it("lets a transport failure pass as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);

            await expect(gateway.folderExists(folderParams)).rejects.toBe(failure);
        });
    });

    describe("deleteWorkflow", () => {
        it("deletes the page workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({
                websiteBuilder: { deleteWebsiteBuilderPageWorkflow: envelope }
            });

            const result = await gateway.deleteWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("mutation");
            expect(request.query).toContain("deleteWebsiteBuilderPageWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
        });
    });
});
