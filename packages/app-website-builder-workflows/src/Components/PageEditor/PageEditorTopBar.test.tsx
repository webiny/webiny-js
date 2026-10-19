import React from "react";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import type { Route } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbPageContentReloader } from "~/features/editorReview/WbPageContentReloader.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import { registerPageContent } from "~/testing/registerPageContent.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
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
    interface StubProps {
        reviewsRoute: Route<any>;
    }
    const EditorReviewBar = (props: StubProps) => {
        return React.createElement("div", {
            "data-testid": "review-bar",
            "data-route": props.reviewsRoute.name
        });
    };
    return { EditorReviewBar };
});

const { Ui } = PageEditorConfig;

const mountTopBar = (pageStatus: WbStatus, kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    registerPageContent(container);
    const editor = createPageEditor(pageStatus);

    const view = render(
        <WbEditorHarness container={container} editor={editor}>
            <PageEditorTopBar />
            <Ui.TopBar.Layout />
        </WbEditorHarness>
    );

    return { ...handle, editor, view };
};

describe("PageEditorTopBar", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the original top bar and exactly one review bar in a strip that reserves its height", () => {
        mountTopBar("draft", "none");

        expect(screen.getAllByTestId("base-top-bar")).toHaveLength(1);
        const bars = screen.getAllByTestId("review-bar");
        expect(bars).toHaveLength(1);
        expect(bars[0].getAttribute("data-route")).toBe("WebsiteBuilder/Pages/WorkflowStateList");
        const strip = bars[0].parentElement;
        expect(strip?.getAttribute("data-affects-preview")).toBe("height");
    });

    it.each(["draft", "published", "unpublished"] as const)(
        "shows the bar on a %s page",
        pageStatus => {
            mountTopBar(pageStatus, "none");

            expect(screen.getAllByTestId("review-bar")).toHaveLength(1);
        }
    );

    it("renders nothing, not even the strip, when the namespace has no workflow", () => {
        mountTopBar("draft", "noWorkflow");

        expect(screen.queryByTestId("review-bar")).toBeNull();
        expect(document.querySelector("[data-affects-preview]")).toBeNull();
        expect(screen.getAllByTestId("base-top-bar")).toHaveLength(1);
    });

    it("initialises the session for the draft revision with the editor's own read-only state", () => {
        const { presenter, useCases } = mountTopBar("draft", "none");

        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(presenter.init).toHaveBeenCalledWith({
            useCases,
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            contentReloader: expect.any(WbPageContentReloader),
            targetTitle: "Home",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("cannot request a review on a published page and marks it published", () => {
        const { presenter, useCases } = mountTopBar("published", "none");

        expect(presenter.init).toHaveBeenCalledWith({
            useCases,
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            contentReloader: expect.any(WbPageContentReloader),
            targetTitle: "Home",
            canRequest: false,
            isPublished: true,
            isUnpublished: false
        });
    });

    it("cannot request a review on an unpublished page, which was published before (Q19)", () => {
        const { presenter } = mountTopBar("unpublished", "none");

        const params = presenter.init.mock.calls[0][0];
        expect(params.canRequest).toBe(false);
        expect(params.isPublished).toBe(false);
        expect(params.isUnpublished).toBe(true);
    });

    it("disposes the session presenter when the editor closes", () => {
        const { presenter, view } = mountTopBar("draft", "none");
        expect(presenter.dispose).not.toHaveBeenCalled();

        view.unmount();

        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });

    it("updates the context without a reload when the page is published", async () => {
        const { presenter, editor } = mountTopBar("draft", "none");

        act(() => {
            editor.updateDocument(state => {
                state.status = WbPageStatus.Published;
            });
        });

        await waitFor(() => {
            expect(presenter.setContext).toHaveBeenLastCalledWith({
                targetTitle: "Home",
                canRequest: true,
                isPublished: true,
                isUnpublished: false
            });
        });
        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(presenter.dispose).not.toHaveBeenCalled();
    });

    it("updates the context with the new title when the page is renamed", async () => {
        const { presenter, editor } = mountTopBar("draft", "none");

        act(() => {
            editor.updateDocument(state => {
                state.properties.title = "Renamed home";
            });
        });

        await waitFor(() => {
            expect(presenter.setContext).toHaveBeenLastCalledWith({
                targetTitle: "Renamed home",
                canRequest: true,
                isPublished: false,
                isUnpublished: false
            });
        });
        expect(presenter.init).toHaveBeenCalledTimes(1);
    });

    it("updates the context without a reload when the page is unpublished (Q19)", async () => {
        const { presenter, editor } = mountTopBar("published", "approved");

        act(() => {
            editor.updateDocument(state => {
                state.status = WbPageStatus.Unpublished;
            });
        });

        await waitFor(() => {
            expect(presenter.setContext).toHaveBeenLastCalledWith({
                targetTitle: "Home",
                canRequest: false,
                isPublished: false,
                isUnpublished: true
            });
        });
        expect(presenter.init).toHaveBeenCalledTimes(1);
    });

    it("names the reason under the bar when the canvas is read-only", () => {
        mountTopBar("draft", "inProgress");

        const note = screen.getByRole("alert");
        expect(note.textContent).toContain("Read-only while this revision is in review.");
    });

    it("shows no note for an editable draft", () => {
        mountTopBar("draft", "none");

        expect(screen.queryByRole("alert")).toBeNull();
    });
});
