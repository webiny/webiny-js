import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider/abstractions.js";
import { WbReviewGateway } from "~/features/gateway/WbReviewGateway/WbReviewGateway.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { CompositionProvider } from "@webiny/react-composition";
import { WorkflowsAdminApp } from "@webiny/app-workflows/app.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/abstractions.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { GetWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/getWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createFakeEditorAppGateway } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorAppGateway.js";
import { CmsWorkflows } from "@webiny/app-headless-cms-workflows";
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/abstractions.js";
import { createFolder } from "~/testing/createFolder.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { ReviewGateway as ReviewGatewayAbstraction } from "@webiny/app-workflows/review/gateway/abstractions.js";
import { ReviewServicesFeature } from "@webiny/app-workflows/review/feature.js";
import { createFakeReviewAppGateway } from "@webiny/app-workflows/review/testing/fakeReviewAppGateway.js";
import { createReviewDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { WebsiteBuilderWorkflows } from "./index.js";

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/index.js", () => {
    return {
        PageEditorConfig: () => null,
        PagesList: () => null
    };
});

vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
    return { WbContentReviews: () => <div data-testid="wb-content-reviews" /> };
});

vi.mock("~/presentation/page/PageList/feature.js", () => {
    return {
        PageListWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("~/presentation/page/PageGet/feature.js", () => {
    return {
        PageGetWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("@webiny/app-workflows/presentation/permissions/index.js", async importOriginal => {
    const actual =
        await importOriginal<
            typeof import("@webiny/app-workflows/presentation/permissions/index.js")
        >();
    return { ...actual, SecurityPermissions: () => null };
});

vi.mock("@webiny/app-workflows/editor/WorkflowEditorConfig.js", () => {
    return { WorkflowEditorConfig: () => null };
});

vi.mock("@webiny/app-workflows/settings/mounting/ExclusionsSettings.js", () => {
    return { ExclusionsSettings: () => null };
});

vi.mock("@webiny/app-workflows/review/trash/components/ActiveReviewWarningConfig.js", () => {
    return { ActiveReviewWarningConfig: () => null };
});

vi.mock("@webiny/app-headless-cms-workflows/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});

vi.mock("@webiny/app-headless-cms-workflows/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryReviewBar: () => null,
        CmsEntryReviewBlockedActions: () => null,
        CmsEntryReviewFormLock: () => null,
        CmsEntryReviewNewRevision: () => null,
        CmsEntryReviewScheduleMenuItem: () => null
    };
});

vi.mock("@webiny/app-headless-cms-workflows/Components/ContentReviews/CmsContentReviews.js", () => {
    return { CmsContentReviews: () => null };
});

vi.mock(
    "@webiny/app-headless-cms-workflows/Components/ContentReviews/CmsContentReviewsSidebarItem.js",
    () => {
        return { CmsContentReviewsSidebarItem: () => null };
    }
);

vi.mock(
    "@webiny/app-headless-cms-workflows/Components/CmsEntriesList/CmsReviewMoveEntryAction.js",
    () => {
        return { CmsReviewMoveEntryAction: () => null };
    }
);

vi.mock("@webiny/app-headless-cms-workflows/presentation/feature.js", () => {
    return {
        CmsWorkflowsFeature: { name: "Mock", register: () => undefined, resolve: () => undefined }
    };
});

vi.mock("@webiny/app-headless-cms-workflows/features/feature.js", () => {
    return {
        CmsWorkflowsCacheFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

describe("WebsiteBuilderWorkflows composition", () => {
    const createContainer = (isEnabled: boolean): Container => {
        const flagsService: FeatureFlagsService.Interface = {
            getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
            isLoaded: () => true,
            loadFlags: async () => undefined
        };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        // app-aco's module registers the folder model provider in the real admin.
        container.registerInstance(FolderModelProvider, {
            getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
            getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
        });
        return container;
    };

    it("sends the routing inspection of the editor through the WB gateway with the flag on", async () => {
        const container = createContainer(true);
        // The data layer of app-workflows, which WorkflowsAdminApp registers in the admin.
        WorkflowEditorRepositoryFeature.register(container);
        InspectRoutingFeature.register(container);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: {
                inspectWebsiteBuilderPageRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCase = container.resolve(InspectRoutingUseCase);
        const inspection = await useCase.execute({
            app: "wb",
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: null
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(lastRequest.query).toContain("inspectWebsiteBuilderPageRouting");
    });

    it("registers the WB editor gateway under the shared app gateway token with the flag on (R347)", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const gateways = container.resolveAll(WorkflowEditorAppGateway);
        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("wb");
    });

    it("registers no editor gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("registers the Content Reviews row provider and the notification handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbReviewRowProvider)).toBeInstanceOf(AppReviewRowProvider);
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(true);
    });

    it("registers neither the row provider nor the notification handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbReviewRowProvider)).toThrow("No registration found");
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(false);
    });

    it("registers the change message handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(true);
    });

    it("registers no change message handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(false);
    });

    it("mounts the Content Reviews route glue with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(screen.queryByTestId("wb-content-reviews")).not.toBeNull();
    });

    it("mounts no Content Reviews glue with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(screen.queryByTestId("wb-content-reviews")).toBeNull();
    });

    it("registers the WB editor gateway and the WB editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(WbWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(WbReviewContentAdapter);

        expect(adapter.appKind).toBe("wb");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolveAll(WorkflowEditorAppGateway)).toHaveLength(1);
    });

    it("lists the folders of a model through the editor adapter with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            aco: {
                listFolders: {
                    data: [createFolder("folder-a", "Landing pages", "root")],
                    error: null
                }
            }
        });

        const adapter = container.resolve(WbWorkflowEditorAppAdapter);
        const folders = await adapter.listFolders("page");

        expect(adapter.getFolderType("page")).toBe("wb:page");
        expect(folders).toEqual([{ id: "folder-a", path: "/Landing pages" }]);
        expect(container.resolve(ListFoldersGateway)).toBeDefined();
    });

    it("registers no folder gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(ListFoldersGateway)).toThrow("No registration found");
    });

    it("registers neither the WB editor gateway nor the WB editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("routes the editor by app only after the render: wb to the WB gateway, cms to the other app (R349, R362)", async () => {
        const container = createContainer(true);
        WorkflowEditorRepositoryFeature.register(container);
        const cmsGateway = createFakeEditorAppGateway("cms");
        cmsGateway.getWorkflow.mockResolvedValue({
            data: createEditorWorkflowDto({ id: "workflow-cms" }),
            error: null
        });
        // A factory runs each time a routing gateway collects the app gateways, so it counts the builds.
        const createCmsGateway = vi.fn(() => cmsGateway);
        container.registerFactory(WorkflowEditorAppGateway, createCmsGateway);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(createCmsGateway).not.toHaveBeenCalled();
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockClear();
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: {
                getWebsiteBuilderPageWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
                    error: null
                }
            }
        });

        const gateway = container.resolve(WorkflowEditorGateway);
        const wb = await gateway.getWorkflow({ app: "wb", id: "workflow-wb" });
        const cms = await gateway.getWorkflow({ app: "cms", id: "workflow-cms" });

        expect(createCmsGateway).toHaveBeenCalledTimes(1);
        expect(wb.id).toBe("workflow-wb");
        expect(cms.id).toBe("workflow-cms");
        expect(vi.mocked(client.execute)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(client.execute).mock.calls[0][0].query).toContain(
            "getWebsiteBuilderPageWorkflow"
        );
        expect(cmsGateway.getWorkflow).toHaveBeenCalledWith("workflow-cms");
    });

    it("routes no editor operation to the WB with the flag off", async () => {
        const container = createContainer(false);
        WorkflowEditorRepositoryFeature.register(container);
        const cmsGateway = createFakeEditorAppGateway("cms");
        container.registerInstance(WorkflowEditorAppGateway, cmsGateway);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const gateway = container.resolve(WorkflowEditorGateway);
        const client = container.resolve(MainGraphQLClient);

        await expect(gateway.getWorkflow({ app: "wb", id: "workflow-wb" })).rejects.toThrow(
            'No workflows app is registered for "wb".'
        );
        expect(vi.mocked(client.execute)).not.toHaveBeenCalled();
    });

    it("routes the editor of each app to its own gateway with the three roots rendered in admin order (R349, A113, R362)", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CompositionProvider>
                    <WorkflowsAdminApp />
                    <CmsWorkflows />
                    <WebsiteBuilderWorkflows />
                </CompositionProvider>
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockClear();
        vi.mocked(client.execute).mockResolvedValueOnce({
            cms: {
                getCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-cms" }),
                    error: null
                }
            }
        });
        vi.mocked(client.execute).mockResolvedValueOnce({
            websiteBuilder: {
                getWebsiteBuilderPageWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
                    error: null
                }
            }
        });

        const getWorkflow = container.resolve(GetWorkflowUseCase);
        const cms = await getWorkflow.execute({ app: "cms", id: "workflow-cms" });
        const wb = await getWorkflow.execute({ app: "wb", id: "workflow-wb" });

        const calls = vi.mocked(client.execute).mock.calls;
        expect(cms.id).toBe("workflow-cms");
        expect(wb.id).toBe("workflow-wb");
        expect(calls).toHaveLength(2);
        expect(calls[0][0].query).toContain("getCmsEntryWorkflow");
        expect(calls[1][0].query).toContain("getWebsiteBuilderPageWorkflow");
        const apps = container.resolveAll(WorkflowEditorAppGateway).map(gateway => gateway.app);
        expect(apps).toEqual(["cms", "wb"]);
    });
    it("registers WbReviewGateway itself under the shared token only with the flag on (R358)", () => {
        const enabled = createContainer(true);
        const disabled = createContainer(false);

        render(
            <DiContainerProvider container={enabled}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        render(
            <DiContainerProvider container={disabled}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["wb"]);
        expect(Object.getPrototypeOf(registered[0])).toBe(WbReviewGateway.prototype);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
    });

    it("routes the page namespace to the WB gateway and CMS namespaces to the other app, built after the render (Review Focus 10, R362)", async () => {
        const container = createContainer(true);
        // The review data features of app-workflows, as WorkflowsAdminApp registers them.
        ReviewServicesFeature.register(container);
        const cmsStub = createFakeReviewAppGateway("cms", ["cms.article"]);
        const phases: string[] = [];
        let phase = "render";
        container.registerFactory(ReviewAppGateway, () => {
            phases.push(phase);
            return cmsStub;
        });

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        phase = "after";

        const gateway = container.resolve(ReviewGatewayAbstraction);
        const client = container.resolve(MainGraphQLClient);
        const pageReviewDto = createReviewDto({ id: "review-2" });
        const pageReview = createReviewWithFlagsDto({ review: pageReviewDto });
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReview: { data: pageReview, error: null } }
        });
        cmsStub.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });

        const wbReview = await gateway.getReview({ namespace: "wb.page", reviewId: "review-2" });
        const cmsReview = await gateway.getReview({
            namespace: "cms.article",
            reviewId: "review-1"
        });

        expect(phases).toEqual(["after"]);
        expect(gateway.getApp("wb.page")).toBe("wb");
        expect(gateway.getApp("cms.article")).toBe("cms");
        expect(wbReview.review.id).toBe("review-2");
        expect(cmsReview.review.id).toBe("review-1");
        const queries = vi.mocked(client.execute).mock.calls.map(call => call[0].query as string);
        expect(
            queries.filter(query => query.includes("getWebsiteBuilderPageReview("))
        ).toHaveLength(1);
        expect(cmsStub.getReview).toHaveBeenCalledWith("review-1");
    });

    it("routes cms.article to CMS and wb.page to WB when the three roots render in the admin's order (Review Focus 10, R349, R362)", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CompositionProvider>
                    <WorkflowsAdminApp />
                    <CmsWorkflows />
                    <WebsiteBuilderWorkflows />
                </CompositionProvider>
            </DiContainerProvider>
        );

        const gateway = container.resolve(ReviewGatewayAbstraction);
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockImplementation(async (request: MainGraphQLClient.Request) => {
            const query = request.query as string;
            if (query.includes("getCmsEntryReview")) {
                return {
                    cms: { getCmsEntryReview: { data: createReviewWithFlagsDto(), error: null } }
                };
            }
            const pageReviewDto = createReviewDto({ id: "review-2" });
            const pageReview = createReviewWithFlagsDto({ review: pageReviewDto });
            return {
                websiteBuilder: { getWebsiteBuilderPageReview: { data: pageReview, error: null } }
            };
        });

        await gateway.getReview({ namespace: "cms.article", reviewId: "review-1" });
        await gateway.getReview({ namespace: "wb.page", reviewId: "review-2" });

        expect(gateway.getApp("cms.article")).toBe("cms");
        expect(gateway.getApp("wb.page")).toBe("wb");
        const queries = vi.mocked(client.execute).mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getCmsEntryReview("))).toHaveLength(1);
        expect(
            queries.filter(query => query.includes("getWebsiteBuilderPageReview("))
        ).toHaveLength(1);
    });
});
