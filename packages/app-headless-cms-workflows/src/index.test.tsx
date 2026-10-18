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
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { ListModelsUseCase } from "@webiny/app-headless-cms/features/model/listModels/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { CmsContentReviewsPresenter } from "~/presentation/contentReviews/abstractions.js";
import { CmsReviewRowProvider } from "~/features/gateway/CmsReviewRowProvider.js";
import { CmsWorkflows } from "./index.js";

vi.mock("~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js", () => {
    return { CmsReviewMoveEntryAction: () => null };
});

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowsEditor: () => null };
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

vi.mock("~/presentation/cmsWorkflowsEditor/feature.js", () => {
    return {
        CmsWorkflowsEditorPresenterFeature: {
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
        container.registerInstance(Notifications, {
            error: vi.fn()
        } as unknown as Notifications.Interface);
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
});
