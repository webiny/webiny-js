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
import type { FolderExistsParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import type { InspectRoutingParams } from "@webiny/app-workflows/editor/gateway/IWorkflowEditorGateway.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./CmsWorkflowEditorGateway.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGatewayImpl.js";

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

const inspectParams: InspectRoutingParams = {
    stepConfig: {
        teams: ["team-1"],
        assignment: {
            strategy: "roundRobin",
            allowManualPick: false,
            rules: [{ id: "rule-1", conditions: {}, target: { type: "team", id: "team-1" } }]
        }
    },
    requesterId: "user-1",
    folderId: "folder-1",
    modelId: "article"
};

const folderParams: FolderExistsParams = { id: "folder-1", type: "cms:article" };

describe("CmsWorkflowEditorGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(CmsWorkflowEditorGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    describe("listModels", () => {
        it("sends search, limit and after and folds data and meta into one page", async () => {
            const rows = [createWorkflowModelRowDto()];
            client.execute.mockResolvedValue({
                cms: {
                    listCmsEntryWorkflowModels: {
                        data: rows,
                        meta: { cursor: "cursor-2", hasMoreItems: true },
                        error: null
                    }
                }
            });

            const result = await gateway.listModels({
                search: "art",
                limit: 20,
                after: "cursor-1"
            });

            expect(result).toEqual({
                data: { rows, meta: { cursor: "cursor-2", hasMoreItems: true } },
                error: null
            });
            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ search: "art", limit: 20, after: "cursor-1" });
            expect(request.query).toContain("cms");
            expect(request.query).toContain(
                "listCmsEntryWorkflowModels(search: $search, limit: $limit, after: $after)"
            );
            expect(request.query).toContain("meta");
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("selects the model, its name and the bound workflow's id and name", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: [], meta: null, error: null } }
            });

            await gateway.listModels({ search: "", limit: 20, after: null });

            const query: string = client.execute.mock.calls[0][0].query;
            expect(query).toMatch(/model\s+modelId\s+name\s+workflow\s*\{\s*id\s+name\s*\}/);
        });

        it("sends an empty search as null", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: [], meta: null, error: null } }
            });

            await gateway.listModels({ search: "", limit: 20, after: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ search: null, limit: 20, after: null });
        });

        it("answers the default meta when the server sends none", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: [], meta: null, error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({
                data: { rows: [], meta: { cursor: null, hasMoreItems: false } },
                error: null
            });
        });

        it("answers an error envelope without data and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: null, meta: null, error } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error });
        });

        it("answers neither data nor error when the server sends neither", async () => {
            client.execute.mockResolvedValue({
                cms: { listCmsEntryWorkflowModels: { data: null, meta: null, error: null } }
            });

            const result = await gateway.listModels({ search: "", limit: 20, after: null });

            expect(result).toEqual({ data: null, error: null });
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
        it("reads the workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({ cms: { getCmsEntryWorkflow: envelope } });

            const result = await gateway.getWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("getCmsEntryWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("returns an error envelope as it is", async () => {
            const envelope = {
                data: null,
                error: { code: "Workflows/Workflow/NotFound", message: "Gone.", data: { id: "x" } }
            };
            client.execute.mockResolvedValue({ cms: { getCmsEntryWorkflow: envelope } });

            expect(await gateway.getWorkflow("x")).toEqual(envelope);
        });
    });

    describe("storeWorkflow", () => {
        it("sends the data and the loaded savedOn string unchanged (D131)", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({ cms: { storeCmsEntryWorkflow: envelope } });

            const result = await gateway.storeWorkflow({ data: input, savedOn: EDITOR_SAVED_ON });

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ data: input, savedOn: "2026-10-18T09:15:30.123Z" });
            expect(request.variables.data).toBe(input);
            expect(request.query).toContain("mutation");
            expect(request.query).toContain(
                "storeCmsEntryWorkflow(data: $data, savedOn: $savedOn)"
            );
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null savedOn for a new workflow", async () => {
            client.execute.mockResolvedValue({
                cms: { storeCmsEntryWorkflow: { data: createEditorWorkflowDto(), error: null } }
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
            client.execute.mockResolvedValue({ cms: { storeCmsEntryWorkflow: envelope } });

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
        it("sends the step config, the bare model id, the requester and the folder as variables", async () => {
            const envelope = { data: createRoutingInspectionDto(), error: null };
            client.execute.mockResolvedValue({ cms: { inspectCmsEntryRouting: envelope } });

            const result = await gateway.inspectRouting(inspectParams);

            expect(result).toEqual(envelope);
            expect(client.execute).toHaveBeenCalledTimes(1);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({
                stepConfig: inspectParams.stepConfig,
                modelId: "article",
                requesterId: "user-1",
                folderId: "folder-1"
            });
            expect(request.query).toContain("query InspectCmsEntryRouting");
            expect(request.query).toContain("cms");
            expect(request.query).toContain(
                "inspectCmsEntryRouting(stepConfig: $stepConfig, modelId: $modelId, requesterId: $requesterId, folderId: $folderId)"
            );
            expect(request.query).toContain("$stepConfig: JSON!");
            expect(request.query).toContain("$modelId: ID!");
            expect(request.query).toContain("$requesterId: ID!");
            expect(request.query).toContain("$folderId: ID");
            expect(request.query).toContain(EDITOR_ROUTING_INSPECTION_FIELDS);
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("sends a null folder as the root", async () => {
            client.execute.mockResolvedValue({
                cms: { inspectCmsEntryRouting: { data: createRoutingInspectionDto(), error: null } }
            });

            await gateway.inspectRouting({ ...inspectParams, folderId: null });

            const request = client.execute.mock.calls[0][0];
            expect(request.variables.folderId).toBeNull();
        });

        it("selects every field of the extended inspection (R289)", async () => {
            client.execute.mockResolvedValue({
                cms: { inspectCmsEntryRouting: { data: createRoutingInspectionDto(), error: null } }
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
                cms: { inspectCmsEntryRouting: { data: null, error } }
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
        it("sends the folder id and the folder type as variables", async () => {
            const envelope = { data: true, error: null };
            client.execute.mockResolvedValue({ cms: { cmsEntryFolderExists: envelope } });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "folder-1", type: "cms:article" });
            expect(request.query).toContain("query CmsEntryFolderExists");
            expect(request.query).toContain("cmsEntryFolderExists(id: $id, type: $type)");
            expect(request.query).toContain("$id: ID!");
            expect(request.query).toContain("$type: String!");
            expect(request.query).toContain(ERROR_FIELDS);
        });

        it("returns false as an answer, not an error", async () => {
            const envelope = { data: false, error: null };
            client.execute.mockResolvedValue({ cms: { cmsEntryFolderExists: envelope } });

            const result = await gateway.folderExists(folderParams);

            expect(result).toEqual({ data: false, error: null });
        });

        it("returns a server error as an envelope and does not throw (R204)", async () => {
            const error = { code: "Workflows/NotAuthorized", message: "No.", data: null };
            client.execute.mockResolvedValue({
                cms: { cmsEntryFolderExists: { data: null, error } }
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
        it("deletes the workflow by id and returns the envelope as it is", async () => {
            const envelope = { data: createEditorWorkflowDto(), error: null };
            client.execute.mockResolvedValue({ cms: { deleteCmsEntryWorkflow: envelope } });

            const result = await gateway.deleteWorkflow("workflow-1");

            expect(result).toEqual(envelope);
            const request = client.execute.mock.calls[0][0];
            expect(request.variables).toEqual({ id: "workflow-1" });
            expect(request.query).toContain("mutation");
            expect(request.query).toContain("deleteCmsEntryWorkflow(id: $id)");
            expect(request.query).toContain(EDITOR_WORKFLOW_FIELDS);
        });

        it("returns a blocked delete envelope as it is", async () => {
            const envelope = {
                data: null,
                error: {
                    code: "Workflows/Workflow/HasActiveReviews",
                    message: "In use.",
                    data: { count: 2, reviews: [] }
                }
            };
            client.execute.mockResolvedValue({ cms: { deleteCmsEntryWorkflow: envelope } });

            expect(await gateway.deleteWorkflow("workflow-1")).toEqual(envelope);
        });
    });
});
