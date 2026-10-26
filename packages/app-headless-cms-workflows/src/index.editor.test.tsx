import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/react-composition";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryEditorWithConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { ContentEntryForm } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/fakeTargetReviewPresenter.js";
import { createTargetReviewViewModel } from "@webiny/app-workflows/review/testing/createTargetReviewViewModel.js";
import { CmsEntryReview } from "~/features/editorReview/abstractions.js";
import { CmsWorkflows } from "./index.js";
import { createEntry } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { MODEL } from "~/testing/models.js";
import { LOADING } from "~/testing/reviewStates.js";

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");

    return {
        EditorReviewBar: () => React.createElement("div", { "data-testid": "editor-review-bar" })
    };
});

/*
 * The workflow editor route, the Content Reviews route, menu and sidebar item and the "open in new window"
 * option need routing and menu providers and are not what this test asserts (Task 11's composition test
 * stubs the same modules).
 */
vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});

vi.mock("~/Components/ContentReviews/CmsContentReviews.js", () => {
    return { CmsContentReviews: () => null };
});

vi.mock("~/Components/ContentReviews/CmsContentReviewsSidebarItem.js", () => {
    return { CmsContentReviewsSidebarItem: () => null };
});

class FakeBasePresenter implements ContentEntryFormPresenter.Interface {
    get vm(): ContentEntryFormPresenter.ViewModel {
        return createFormVm({ entry: createEntry(), model: MODEL });
    }

    async loadRevision(): Promise<void> {}

    async saveRevision(): Promise<boolean> {
        return true;
    }

    async publishRevision(): Promise<boolean> {
        return true;
    }

    async unpublishRevision(): Promise<boolean> {
        return true;
    }

    async deleteEntry(): Promise<boolean> {
        return true;
    }

    setFolderId(): void {}

    newEntry(): void {}

    patchEntryMeta(): void {}

    reset(): void {}
}

const BasePresenter = ContentEntryFormPresenter.createImplementation({
    implementation: FakeBasePresenter,
    dependencies: []
});

const ActionsProbe = () => {
    const { buttonActions, menuItemActions } = useContentEntryEditorConfig();
    const names = [...buttonActions, ...menuItemActions].map(action => action.name);

    // Only the schedule item is rendered, the other menu items need the router.
    const scheduleActions = menuItemActions.filter(action => action.name === "schedule");

    return (
        <>
            <div data-testid="action-names">{names.join(",")}</div>
            {scheduleActions.map(action => (
                <span key={action.name}>{action.element}</span>
            ))}
        </>
    );
};

function mountRoot(isEnabled: boolean) {
    const flagsService: FeatureFlagsService.Interface = {
        getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    };
    const container = new Container();
    const presenter = createFakePresenter(createTargetReviewViewModel(LOADING));
    container.registerInstance(FeatureFlagsService, flagsService);
    container.registerInstance(TargetReviewPresenter, presenter);
    container.register(BasePresenter).inSingletonScope();

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={MODEL}>
                        <CmsWorkflows />
                        <ContentEntryEditorConfig>
                            <ContentEntryEditorConfig.Width value={"1020px"} />
                            <ContentEntryEditorConfig.Actions.MenuItemAction
                                name={"schedule"}
                                element={<span data-testid="schedule-item" />}
                            />
                        </ContentEntryEditorConfig>
                        <ContentEntryEditorWithConfig>
                            <ActionsProbe />
                            <ContentEntryForm />
                            <ContentEntryFormContent>
                                <div data-testid="original" />
                            </ContentEntryFormContent>
                        </ContentEntryEditorWithConfig>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { container, presenter };
}

describe("CmsWorkflows editor wiring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("registers the session, the bar, the actions and the presenter decorator with the flag on", async () => {
        const { container, presenter } = mountRoot(true);

        const session = container.resolve(CmsEntryReview);
        expect(session.presenter).toBe(presenter);
        expect(await screen.findAllByTestId("editor-review-bar")).toHaveLength(1);

        const names = (await screen.findByTestId("action-names")).textContent ?? "";
        expect(names).toContain("workflowBlockedActions");
        expect(names).toContain("createNewRevision");
        expect(names).not.toContain("workflowStateTooltip");

        await waitFor(() => expect(document.querySelector("fieldset[disabled]")).not.toBeNull());
        await waitFor(() => expect(screen.queryByTestId("schedule-item")).toBeNull());

        const form = container.resolve(ContentEntryFormPresenter);
        await form.loadRevision("entry-1#0001");
        expect(presenter.init).toHaveBeenCalledTimes(1);
    });

    it("registers nothing with the flag off", async () => {
        const { container, presenter } = mountRoot(false);

        expect(() => container.resolve(CmsEntryReview)).toThrow("No registration found");
        expect(await screen.findByTestId("original")).toBeTruthy();
        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());

        const names = (await screen.findByTestId("action-names")).textContent ?? "";
        expect(names).not.toContain("workflowBlockedActions");
        expect(names).not.toContain("createNewRevision");

        expect(await screen.findByTestId("schedule-item")).toBeTruthy();
        expect(document.querySelector("fieldset")).toBeNull();

        const form = container.resolve(ContentEntryFormPresenter);
        await form.loadRevision("entry-1#0001");
        expect(presenter.init).not.toHaveBeenCalled();
    });
});
