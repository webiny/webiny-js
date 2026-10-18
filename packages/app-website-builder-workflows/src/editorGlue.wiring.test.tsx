import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsEntryReview } from "@webiny/app-headless-cms-workflows/features/editorReview/CmsEntryReview.js";
import { CmsEntryReviewFeature } from "@webiny/app-headless-cms-workflows/features/editorReview/feature.js";
import { CmsReviewUseCases } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCases.js";
import { CmsReviewFeature } from "@webiny/app-headless-cms-workflows/features/gateway/feature.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import { registerPageContent } from "~/testing/registerPageContent.js";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: () => flags.enabled }) };
});

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/PagesList/index.js", () => {
    return { PagesList: () => null };
});

vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
    return { WbContentReviews: () => null };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/TopBar/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("TopBarLayout", () => {
        return React.createElement("div", { "data-testid": "base-top-bar" });
    });
    return { Layout, TopBarOptionsMenu: () => null };
});

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");
    const EditorReviewBar = () => {
        return React.createElement("div", { "data-testid": "review-bar" });
    };
    return { EditorReviewBar };
});

const { Ui } = PageEditorConfig;

const mountRoot = (enabled: boolean) => {
    flags.enabled = enabled;
    const handle = createFakeSession("inProgress");
    const container = new Container();
    container.registerInstance(TargetReviewPresenter, handle.presenter);
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    registerPageContent(container);
    const editor = createPageEditor("draft");

    render(
        <WbEditorHarness container={container} editor={editor}>
            <WebsiteBuilderWorkflows />
            <Ui.Layout />
            <Ui.TopBar.Layout />
        </WbEditorHarness>
    );

    return { ...handle, container, editor };
};

describe("Website Builder editor glue from the composition root", () => {
    afterEach(() => {
        cleanup();
    });

    it("flag on: the session is registered over the shared presenter and this app's use cases", () => {
        const { container, presenter } = mountRoot(true);

        const session = container.resolve(WbPageReview);
        expect(session.presenter).toBe(presenter);
        expect(session.useCases).toBe(container.resolve(WbReviewUseCases));
    });

    it("flag on: this app's session and the CMS editor session coexist in one container (R237)", () => {
        const { container } = mountRoot(true);
        CmsReviewFeature.register(container);
        CmsEntryReviewFeature.register(container);

        const wbSession = container.resolve(WbPageReview);
        const cmsSession = container.resolve(CmsEntryReview);

        expect(cmsSession).not.toBe(wbSession);
        expect(wbSession.useCases).toBe(container.resolve(WbReviewUseCases));
        expect(cmsSession.useCases).toBe(container.resolve(CmsReviewUseCases));
        expect(cmsSession.useCases).not.toBe(wbSession.useCases);
    });

    it("flag on: the bar is mounted under the top bar and the canvas follows the review", () => {
        const { presenter, editor } = mountRoot(true);

        expect(screen.getAllByTestId("review-bar")).toHaveLength(1);
        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(editor.getEditorState().read().isReadOnly).toBe(true);
    });

    it("flag off: nothing is registered or mounted", () => {
        const { container, presenter, editor } = mountRoot(false);

        expect(() => container.resolve(WbPageReview)).toThrow();
        expect(screen.queryByTestId("review-bar")).toBeNull();
        expect(presenter.init).not.toHaveBeenCalled();
        expect(editor.getEditorState().read().isReadOnly).toBe(false);
    });
});
