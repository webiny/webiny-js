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
import { CmsWorkflowEditorFeature } from "@webiny/app-headless-cms-workflows/features/editorGateway/feature.js";
import { CmsWorkflowEditorUseCases } from "@webiny/app-headless-cms-workflows/features/editorGateway/CmsWorkflowEditorUseCases.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway.js";
import { WbWorkflowEditorUseCases } from "./WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorFeature } from "./feature.js";

interface RecordedRequest {
    query: string;
}

describe("WbWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbWorkflowEditorFeature.register(container);
    });

    it("registers the gateway and the use cases under the WB tokens", () => {
        const { useCases } = WbWorkflowEditorFeature.resolve(container);

        expect(useCases).toBeDefined();
        expect(container.resolve(WbWorkflowEditorGateway)).toBeDefined();
    });

    it("registers every token as a singleton", () => {
        expect(container.resolve(WbWorkflowEditorGateway)).toBe(
            container.resolve(WbWorkflowEditorGateway)
        );
        expect(container.resolve(WbWorkflowEditorUseCases)).toBe(
            container.resolve(WbWorkflowEditorUseCases)
        );
    });

    it("runs the shared use cases over the WB gateway: the single Pages row", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: {
                listWebsiteBuilderPageWorkflows: {
                    data: [{ id: "workflow-1", name: "Page review", models: ["wb.page"] }],
                    error: null
                }
            }
        });
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const page = await useCases.listModels({ search: "", limit: 20, after: null });

        expect(page.rows).toEqual([
            {
                model: "wb.page",
                modelId: "page",
                name: "Pages",
                workflow: { id: "workflow-1", name: "Page review" }
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
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const loaded = await useCases.getWorkflow("workflow-1");
        await useCases.storeWorkflow({
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
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        const promise = useCases.deleteWorkflow("workflow-1");

        await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
        await expect(promise).rejects.toMatchObject({
            code: WorkflowErrorCode.HasActiveReviews,
            data
        });
    });

    it("lets a transport failure pass through the use cases as it is", async () => {
        const failure = new Error("Network down.");
        client.execute.mockRejectedValue(failure);
        const useCases = container.resolve(WbWorkflowEditorUseCases);

        await expect(useCases.getWorkflow("workflow-1")).rejects.toBe(failure);
    });

    it("lets the CMS and WB editor features coexist in one container, each with its own gateway (R237)", async () => {
        CmsWorkflowEditorFeature.register(container);
        client.execute.mockImplementation(async (request: RecordedRequest) => {
            if (request.query.includes("getCmsEntryWorkflow")) {
                return {
                    cms: {
                        getCmsEntryWorkflow: {
                            data: createEditorWorkflowDto({ id: "workflow-cms" }),
                            error: null
                        }
                    }
                };
            }
            return {
                websiteBuilder: {
                    getWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
                        error: null
                    }
                }
            };
        });
        const cmsUseCases = container.resolve(CmsWorkflowEditorUseCases);
        const wbUseCases = container.resolve(WbWorkflowEditorUseCases);

        const cms = await cmsUseCases.getWorkflow("workflow-cms");
        const wb = await wbUseCases.getWorkflow("workflow-wb");

        expect(wbUseCases).not.toBe(cmsUseCases);
        expect(cms.id).toBe("workflow-cms");
        expect(wb.id).toBe("workflow-wb");
        const queries = client.execute.mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getCmsEntryWorkflow"))).toHaveLength(1);
        expect(
            queries.filter(query => query.includes("getWebsiteBuilderPageWorkflow"))
        ).toHaveLength(1);
    });
});
