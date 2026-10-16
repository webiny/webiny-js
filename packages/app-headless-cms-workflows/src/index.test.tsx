import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflows } from "./index.js";

vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowsEditor: () => null };
});

vi.mock("~/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryFormScheduleMenuItemAction: () => null,
        CmsEntryFormTooltipButton: () => null,
        ContentEntryFormWorkflow: () => null
    };
});

vi.mock("~/Components/CmsEntriesWorkflowStateList/index.js", () => {
    return { CmsEntriesWorkflowStateListFooterMenu: () => null };
});

vi.mock("~/Components/OptionItem/OpenInNewWindow.js", () => {
    return { ListOpenInNewWindow: () => null };
});

vi.mock("~/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.js", () => {
    return { CmsEntryFormCreateNewRevisionButton: () => null };
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
            getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
            isLoaded: () => true,
            loadFlags: async () => undefined
        };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
        return container;
    };

    it("registers the CMS review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(CmsReviewUseCases)).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsReviewUseCases)).toThrow("No registration found");
    });
});
