import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowErrorCode } from "@webiny/app-workflows/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { ReviewRepositoryFeature } from "@webiny/app-workflows/review/repository/feature.js";
import { DeleteWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/deleteWorkflow/abstractions.js";
import { DeleteWorkflowFeature } from "@webiny/app-workflows/editor/useCases/deleteWorkflow/feature.js";
import { FolderExistsUseCase } from "@webiny/app-workflows/editor/useCases/folderExists/abstractions.js";
import { FolderExistsFeature } from "@webiny/app-workflows/editor/useCases/folderExists/feature.js";
import { GetWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/getWorkflow/abstractions.js";
import { GetWorkflowFeature } from "@webiny/app-workflows/editor/useCases/getWorkflow/feature.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { ListWorkflowModelsUseCase } from "@webiny/app-workflows/editor/useCases/listWorkflowModels/abstractions.js";
import { ListWorkflowModelsFeature } from "@webiny/app-workflows/editor/useCases/listWorkflowModels/feature.js";
import { StoreWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/storeWorkflow/abstractions.js";
import { StoreWorkflowFeature } from "@webiny/app-workflows/editor/useCases/storeWorkflow/feature.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { WbWorkflowEditorFeature } from "./feature.js";

describe("WbWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbWorkflowEditorFeature.register(container);
    });

    it("registers only the WB gateway under the shared app gateway token (R347, R362)", () => {
        const gateways = container.resolveAll(WorkflowEditorAppGateway);

        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("wb");
    });

    it("registers the gateway as a singleton", () => {
        expect(container.resolve(WorkflowEditorAppGateway)).toBe(
            container.resolve(WorkflowEditorAppGateway)
        );
    });

    describe("the shared editor use cases over the WB gateway", () => {
        beforeEach(() => {
            WorkflowEditorRepositoryFeature.register(container);
            // The store and delete use cases clear the review workflow cache (R350).
            ReviewRepositoryFeature.register(container);
            ListWorkflowModelsFeature.register(container);
            GetWorkflowFeature.register(container);
            StoreWorkflowFeature.register(container);
            DeleteWorkflowFeature.register(container);
            InspectRoutingFeature.register(container);
            FolderExistsFeature.register(container);
        });

        it("runs the routing inspection without a model", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    inspectWebsiteBuilderPageRouting: {
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
            const useCase = container.resolve(InspectRoutingUseCase);

            const inspection = await useCase.execute({
                app: "wb",
                stepConfig: { teams: ["team-2"], assignment: { strategy: "none", rules: [] } },
                requesterId: "user-1",
                folderId: null,
                modelId: "page"
            });

            expect(inspection.ruleId).toBe("rule-2");
            expect(inspection.narrowedTeamId).toBe("team-2");
            expect(inspection.candidateIds).toEqual(["user-3"]);
            expect(inspection.candidateCount).toBe(4);
            expect(client.execute.mock.calls[0][0].variables).not.toHaveProperty("modelId");
        });

        it("answers false for a deleted folder, not an error", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: { data: false, error: null } }
            });
            const useCase = container.resolve(FolderExistsUseCase);

            const exists = await useCase.execute({ app: "wb", id: "folder-1", type: "wb:page" });

            expect(exists).toBe(false);
            expect(client.execute.mock.calls[0][0].variables).toEqual({ id: "folder-1" });
        });

        it("lists the single Pages row", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [
                            {
                                id: "workflow-1",
                                name: "Page review",
                                models: ["wb.page"],
                                steps: [{ id: "step-1" }]
                            }
                        ],
                        error: null
                    }
                }
            });
            const useCase = container.resolve(ListWorkflowModelsUseCase);

            const page = await useCase.execute({ app: "wb", search: "", limit: 20, after: null });

            expect(page.rows).toEqual([
                {
                    model: "wb.page",
                    modelId: "page",
                    name: "Pages",
                    workflow: { id: "workflow-1", name: "Page review", stepCount: 1 }
                }
            ]);
            expect(page.cursor).toBeNull();
            expect(page.hasMoreItems).toBe(false);
        });

        it("keeps savedOn as the identical string from the read to the store (D131)", async () => {
            client.execute.mockResolvedValueOnce({
                websiteBuilder: {
                    getWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto({ models: ["wb.page"] }),
                        error: null
                    }
                }
            });
            client.execute.mockResolvedValueOnce({
                websiteBuilder: {
                    storeWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto({ models: ["wb.page"] }),
                        error: null
                    }
                }
            });
            const getWorkflow = container.resolve(GetWorkflowUseCase);
            const storeWorkflow = container.resolve(StoreWorkflowUseCase);

            const loaded = await getWorkflow.execute({ app: "wb", id: "workflow-1" });
            await storeWorkflow.execute({
                app: "wb",
                data: { id: loaded.id, name: loaded.name, models: loaded.models, steps: [] },
                savedOn: loaded.savedOn
            });

            expect(client.execute.mock.calls[1][0].variables.savedOn).toBe(EDITOR_SAVED_ON);
        });

        it("turns an envelope error into a GraphQLOperationError that keeps code and data", async () => {
            const data = { count: 1, reviews: [{ reviewId: "review-1" }] };
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    deleteWebsiteBuilderPageWorkflow: {
                        data: null,
                        error: {
                            code: WorkflowErrorCode.HasActiveReviews,
                            message: "In use.",
                            data
                        }
                    }
                }
            });
            const useCase = container.resolve(DeleteWorkflowUseCase);

            const promise = useCase.execute({ app: "wb", id: "workflow-1" });

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.HasActiveReviews,
                data
            });
        });

        it("lets a transport failure pass through the use cases as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);
            const useCase = container.resolve(GetWorkflowUseCase);

            await expect(useCase.execute({ app: "wb", id: "workflow-1" })).rejects.toBe(failure);
        });
    });
});
