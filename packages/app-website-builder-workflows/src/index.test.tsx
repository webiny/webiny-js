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
import { WbReviewRowProvider } from "~/features/gateway/WbReviewRowProvider.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases.js";
import { WbWorkflowEditorAppAdapter } from "~/features/editorMounting/WbWorkflowEditorAppAdapter.js";
import { createFolder } from "~/testing/createFolder.js";
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

    it("registers the WB review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbReviewUseCases)).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbReviewUseCases)).toThrow("No registration found");
    });

    it("sends the routing inspection of the editor through the WB gateway with the flag on", async () => {
        const container = createContainer(true);

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

        const useCases = container.resolve(WbWorkflowEditorUseCases);
        const inspection = await useCases.inspectRouting({
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

    it("registers the WB workflow editor use cases with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers no workflow editor use cases with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorUseCases)).toThrow("No registration found");
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

    it("registers the workflow editor use cases and the WB editor adapter with the flag on", () => {
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
        expect(container.resolve(WbWorkflowEditorUseCases)).toBeDefined();
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

    it("registers neither the workflow editor use cases nor the WB editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(() => container.resolve(WbWorkflowEditorUseCases)).toThrow("No registration found");
    });
});
