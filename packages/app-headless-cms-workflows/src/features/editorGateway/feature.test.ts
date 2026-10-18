import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "@webiny/app-workflows/editor/domain/WorkflowErrorCode.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
import { CmsWorkflowEditorUseCases } from "./CmsWorkflowEditorUseCases.js";
import { CmsWorkflowEditorFeature } from "./feature.js";

describe("CmsWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        CmsWorkflowEditorFeature.register(container);
    });

    it("registers the gateway and the use cases under the CMS tokens", () => {
        const { useCases } = CmsWorkflowEditorFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(container.resolve(CmsWorkflowEditorGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(CmsWorkflowEditorGateway)).toBe(
            container.resolve(CmsWorkflowEditorGateway)
        );
        expect(container.resolve(CmsWorkflowEditorUseCases)).toBe(
            container.resolve(CmsWorkflowEditorUseCases)
        );
    });

    it("runs the shared use cases over the CMS gateway: the routing inspection", async () => {
        client.execute.mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: createRoutingInspectionDto({
                        ruleId: "rule-2",
                        narrowedTeamId: "team-2",
                        candidateIds: ["user-3"],
                        candidateCount: 4
                    }),
                    error: null
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-2"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        expect(inspection.ruleId).toBe("rule-2");
        expect(inspection.narrowedTeamId).toBe("team-2");
        expect(inspection.candidateIds).toEqual(["user-3"]);
        expect(inspection.candidateCount).toBe(4);
        expect(client.execute.mock.calls[0][0].variables.modelId).toBe("article");
        expect(client.execute.mock.calls[0][0].variables.folderId).toBeNull();
    });

    it("runs the shared use cases over the CMS gateway: a deleted folder is false, not an error", async () => {
        client.execute.mockResolvedValue({
            cms: { cmsEntryFolderExists: { data: false, error: null } }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const exists = await useCases.folderExists({ id: "folder-1", type: "cms:article" });

        expect(exists).toBe(false);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            id: "folder-1",
            type: "cms:article"
        });
    });

    it("turns a rule validation error of the inspector into a GraphQLOperationError that keeps the rule id", async () => {
        const data = {
            stepId: "step-1",
            field: "config.assignment.rules.target",
            ruleId: "rule-1",
            workflowId: null
        };
        client.execute.mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: null,
                    error: {
                        code: WorkflowErrorCode.Validation,
                        message: "The target team is not one of the step's reviewing teams.",
                        data
                    }
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const promise = useCases.inspectRouting({
            stepConfig: { teams: ["team-1"], assignment: { rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: WorkflowErrorCode.Validation, data });
    });

    it("runs the shared use cases over the CMS gateway: the model list", async () => {
        client.execute.mockResolvedValue({
            cms: {
                listCmsEntryWorkflowModels: {
                    data: [createWorkflowModelRowDto()],
                    meta: { cursor: "cursor-2", hasMoreItems: true },
                    error: null
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const page = await useCases.listModels({ search: "", limit: 20, after: null });

        expect(page.cursor).toBe("cursor-2");
        expect(page.hasMoreItems).toBe(true);
        expect(page.rows[0].model).toBe("cms.article");
    });

    it("keeps savedOn as the identical string from the read to the store (D131)", async () => {
        client.execute.mockResolvedValueOnce({
            cms: {
                getCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30.123Z" }),
                    error: null
                }
            }
        });
        client.execute.mockResolvedValueOnce({
            cms: {
                storeCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ savedOn: "2026-10-18T09:20:00.000Z" }),
                    error: null
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const loaded = await useCases.getWorkflow("workflow-1");
        const stored = await useCases.storeWorkflow({
            data: { id: loaded.id, name: loaded.name, models: loaded.models, steps: [] },
            savedOn: loaded.savedOn
        });

        expect(loaded.savedOn).toBe(EDITOR_SAVED_ON);
        expect(client.execute.mock.calls[1][0].variables.savedOn).toBe(EDITOR_SAVED_ON);
        expect(stored.savedOn).toBe("2026-10-18T09:20:00.000Z");
    });

    it("turns an envelope error into a GraphQLOperationError that keeps code and data", async () => {
        const data = { savedOn: "2026-10-18T10:00:00.000Z", savedBy: { displayName: "Grace" } };
        client.execute.mockResolvedValue({
            cms: {
                storeCmsEntryWorkflow: {
                    data: null,
                    error: {
                        code: WorkflowErrorCode.Conflict,
                        message: "The workflow was changed.",
                        data
                    }
                }
            }
        });
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        const promise = useCases.storeWorkflow({
            data: { id: "workflow-1", name: "A", models: ["cms.article"], steps: [] },
            savedOn: EDITOR_SAVED_ON
        });

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({ code: WorkflowErrorCode.Conflict, data });
    });

    it("lets a transport failure pass through the use cases as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);
        const useCases = container.resolve(CmsWorkflowEditorUseCases);

        await expect(useCases.deleteWorkflow("workflow-1")).rejects.toBe(failure);
    });
});
