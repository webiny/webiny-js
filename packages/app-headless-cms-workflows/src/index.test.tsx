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
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { FolderModelProvider } from "@webiny/app-aco/features/folders/abstractions.js";
import { ListFoldersGateway } from "@webiny/app-aco/features/folders/listFolders/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/abstractions.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createFakeEditorAppGateway } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorAppGateway.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { createWorkflowsIdentityContext } from "@webiny/app-workflows/review/testing/createWorkflowsIdentityContext.js";
import { CmsContentReviewsPresenter } from "~/presentation/contentReviews/abstractions.js";
import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider/abstractions.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { CmsWorkflowEditorAppAdapter } from "~/features/editorMounting/abstractions.js";
import { createFolder } from "~/testing/createFolder.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { ReviewGateway as ReviewGatewayAbstraction } from "@webiny/app-workflows/review/gateway/abstractions.js";
import { ReviewGateway } from "@webiny/app-workflows/review/gateway/ReviewGateway.js";
import { createFakeReviewAppGateway } from "@webiny/app-workflows/review/testing/fakeReviewAppGateway.js";
import { createReviewDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { CmsWorkflows } from "./index.js";

vi.mock("~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js", () => {
    return { CmsReviewMoveEntryAction: () => null };
});

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});

vi.mock("~/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryReviewBar: () => null,
        CmsEntryReviewBlockedActions: () => null,
        CmsEntryReviewFormLock: () => null,
        CmsEntryReviewNewRevision: () => null,
        CmsEntryReviewScheduleMenuItem: () => null
    };
});

vi.mock("~/Components/ContentReviews/CmsContentReviews.js", () => {
    return { CmsContentReviews: () => <div data-testid="cms-content-reviews" /> };
});

vi.mock("~/Components/ContentReviews/CmsContentReviewsSidebarItem.js", () => {
    return {
        CmsContentReviewsSidebarItem: () => <div data-testid="cms-content-reviews-sidebar" />
    };
});

vi.mock("~/presentation/feature.js", () => {
    return {
        CmsWorkflowsFeature: { name: "Mock", register: () => undefined, resolve: () => undefined }
    };
});

vi.mock("~/features/feature.js", () => {
    return {
        CmsWorkflowsCacheFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

describe("CmsWorkflows composition", () => {
    const createContainer = (isEnabled: boolean): Container => {
        const flagsService: FeatureFlagsService.Interface = {
            getFlags: () => {
                return new FeatureFlags({ advancedPublishingWorkflow: isEnabled });
            },
            isLoaded: () => true,
            loadFlags: async () => undefined
        };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        const client = { execute: vi.fn() };
        container.registerInstance(MainGraphQLClient, client);
        container.registerInstance(ModelsCache, {
            getItem: () => undefined,
            getItems: () => [],
            hasItems: () => true
        } as unknown as ModelsCache.Interface);
        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        container.registerInstance(ListModelsUseCase, {
            execute: async () => []
        } as unknown as ListModelsUseCase.Interface);
        // The admin registers the signed-in identity; the model list waits for one.
        container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
        container.registerInstance(Notifications, {
            error: vi.fn()
        } as unknown as Notifications.Interface);
        // app-aco's module registers the folder model provider in the real admin.
        container.registerInstance(FolderModelProvider, {
            getModel: vi.fn().mockRejectedValue(new Error("The folder model is not needed here.")),
            getGraphQLSelection: vi.fn().mockResolvedValue("{ id title parentId }")
        });
        return container;
    };

    it("registers the CMS review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const useCases = container.resolve(CmsReviewUseCases);

        expect(useCases).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const resolve = () => {
            return container.resolve(CmsReviewUseCases);
        };

        expect(resolve).toThrow("No registration found");
    });

    it("registers the CMS editor gateway under the shared app gateway token with the flag on (R347)", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const gateways = container.resolveAll(WorkflowEditorAppGateway);
        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("cms");
    });

    it("registers no editor gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("sends the routing inspection of the editor through the CMS gateway with the flag on", async () => {
        const container = createContainer(true);
        // The data layer of app-workflows, which WorkflowsAdminApp registers in the admin.
        WorkflowEditorRepositoryFeature.register(container);
        InspectRoutingFeature.register(container);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
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
            app: "cms",
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(inspection.owner).toBeNull();
        expect(lastRequest.query).toContain("inspectCmsEntryRouting");
    });

    it("registers the Content Reviews row provider and the notification handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(CmsReviewRowProvider)).toBeInstanceOf(AppReviewRowProvider);
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(true);
    });

    it("registers neither the row provider nor the notification handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsReviewRowProvider)).toThrow("No registration found");
        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewNotificationHandler)).toBe(false);
    });

    it("registers the change message handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(true);
    });

    it("registers no change message handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(false);
    });

    it("mounts the Content Reviews route and sidebar item and registers the presenter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(screen.queryByTestId("cms-content-reviews")).not.toBeNull();
        expect(screen.queryByTestId("cms-content-reviews-sidebar")).not.toBeNull();
        expect(container.resolve(CmsContentReviewsPresenter)).toBeDefined();
    });

    it("mounts no Content Reviews glue and registers no presenter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(screen.queryByTestId("cms-content-reviews")).toBeNull();
        expect(screen.queryByTestId("cms-content-reviews-sidebar")).toBeNull();
        expect(() => container.resolve(CmsContentReviewsPresenter)).toThrow(
            "No registration found"
        );
    });

    it("registers the CMS editor gateway and the CMS editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(CmsWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(CmsReviewContentAdapter);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolveAll(WorkflowEditorAppGateway)).toHaveLength(1);
    });

    it("lists the folders of a model through the editor adapter with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            aco: {
                listFolders: {
                    data: [createFolder("folder-a", "Campaigns", "root")],
                    error: null
                }
            }
        });

        const adapter = container.resolve(CmsWorkflowEditorAppAdapter);
        const folders = await adapter.listFolders("article");

        expect(adapter.getFolderType("article")).toBe("cms:article");
        expect(folders).toEqual([{ id: "folder-a", path: "/Campaigns" }]);
        expect(container.resolve(ListFoldersGateway)).toBeDefined();
    });

    it("registers no folder gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(ListFoldersGateway)).toThrow("No registration found");
    });

    it("registers neither the CMS editor gateway nor the CMS editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("routes the editor by app only after the render: cms to the CMS gateway, wb to the other app (R349, R362)", async () => {
        const container = createContainer(true);
        WorkflowEditorRepositoryFeature.register(container);
        const wbGateway = createFakeEditorAppGateway("wb");
        wbGateway.getWorkflow.mockResolvedValue({
            data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
            error: null
        });
        // A factory runs each time a routing gateway collects the app gateways, so it counts the builds.
        const createWbGateway = vi.fn(() => wbGateway);
        container.registerFactory(WorkflowEditorAppGateway, createWbGateway);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(createWbGateway).not.toHaveBeenCalled();
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockClear();
        vi.mocked(client.execute).mockResolvedValue({
            cms: {
                getCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-cms" }),
                    error: null
                }
            }
        });

        const gateway = container.resolve(WorkflowEditorGateway);
        const cms = await gateway.getWorkflow({ app: "cms", id: "workflow-cms" });
        const wb = await gateway.getWorkflow({ app: "wb", id: "workflow-wb" });

        expect(createWbGateway).toHaveBeenCalledTimes(1);
        expect(cms.id).toBe("workflow-cms");
        expect(wb.id).toBe("workflow-wb");
        expect(vi.mocked(client.execute)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(client.execute).mock.calls[0][0].query).toContain("getCmsEntryWorkflow");
        expect(wbGateway.getWorkflow).toHaveBeenCalledWith("workflow-wb");
    });

    it("routes no editor operation to the CMS with the flag off", async () => {
        const container = createContainer(false);
        WorkflowEditorRepositoryFeature.register(container);
        const wbGateway = createFakeEditorAppGateway("wb");
        container.registerInstance(WorkflowEditorAppGateway, wbGateway);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const gateway = container.resolve(WorkflowEditorGateway);
        const client = container.resolve(MainGraphQLClient);

        await expect(gateway.getWorkflow({ app: "cms", id: "workflow-cms" })).rejects.toThrow(
            'No workflows app is registered for "cms".'
        );
        expect(vi.mocked(client.execute)).not.toHaveBeenCalled();
    });
    it("registers the CMS review app gateway under the shared token only with the flag on (R356)", () => {
        const enabled = createContainer(true);
        const disabled = createContainer(false);

        render(
            <DiContainerProvider container={enabled}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        render(
            <DiContainerProvider container={disabled}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["cms"]);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
    });

    it("routes CMS namespaces to the CMS gateway and the page namespace to the other app, built after the render (Review Focus 10, R362)", async () => {
        const container = createContainer(true);
        // The data features of app-workflows; Task 8 registers ReviewServicesFeature instead.
        container.register(ReviewGateway).inSingletonScope();
        const wbStub = createFakeReviewAppGateway("wb", ["wb.page"]);
        const phases: string[] = [];
        let phase = "render";
        // The routing gateway collects the app gateways once, when it is built (R349).
        container.registerFactory(ReviewAppGateway, () => {
            phases.push(phase);
            return wbStub;
        });

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        phase = "after";

        const gateway = container.resolve(ReviewGatewayAbstraction);
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            cms: { getCmsEntryReview: { data: createReviewWithFlagsDto(), error: null } }
        });
        const pageReviewDto = createReviewDto({ id: "review-2" });
        const pageReview = createReviewWithFlagsDto({ review: pageReviewDto });
        wbStub.getReview.mockResolvedValue({ data: pageReview, error: null });

        const cmsReview = await gateway.getReview({
            namespace: "cms.article",
            reviewId: "review-1"
        });
        const wbReview = await gateway.getReview({ namespace: "wb.page", reviewId: "review-2" });

        expect(phases).toEqual(["after"]);
        expect(gateway.getApp("cms.article")).toBe("cms");
        expect(gateway.getApp("wb.page")).toBe("wb");
        expect(cmsReview.review.id).toBe("review-1");
        expect(wbReview.review.id).toBe("review-2");
        const queries = vi.mocked(client.execute).mock.calls.map(call => call[0].query as string);
        expect(queries.filter(query => query.includes("getCmsEntryReview("))).toHaveLength(1);
        expect(wbStub.getReview).toHaveBeenCalledWith("review-2");
    });
});
