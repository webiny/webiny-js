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
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
// Loads the admin package before the editor modules, the order the other editor tests get through their imports.
import "@webiny/app-admin";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbPageContentReloader } from "~/features/editorReview/WbPageContentReloader.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import { registerPageContent } from "~/testing/registerPageContent.js";
import { PageReviewBar } from "./PageReviewBar.js";

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");
    const EditorReviewBar = () => {
        return React.createElement("div", { "data-testid": "review-bar" });
    };
    return { EditorReviewBar };
});

const mountBar = () => {
    const handle = createFakeSession("inProgress");
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const content = registerPageContent(container);
    const editor = createPageEditor("draft");

    const view = render(
        <WbEditorHarness container={container} editor={editor}>
            <PageReviewBar />
        </WbEditorHarness>
    );

    return { ...handle, ...content, editor, view };
};

describe("PageReviewBar", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the review bar", () => {
        mountBar();

        expect(screen.queryAllByTestId("review-bar")).toHaveLength(1);
    });

    it("initialises the presenter with the target, the context and a page content reloader (R262)", () => {
        const { presenter, useCases } = mountBar();

        expect(presenter.init).toHaveBeenCalledTimes(1);
        const params = presenter.init.mock.calls[0][0];
        expect(params.useCases).toBe(useCases);
        expect(params.target).toEqual({ namespace: "wb.page", targetRevisionId: "page-1#0001" });
        expect(params.targetTitle).toBe("Home");
        expect(params.contentReloader).toBeInstanceOf(WbPageContentReloader);
    });

    it("builds a reloader over the editor, the full page cache and the get use case", async () => {
        const { presenter, getPage, cache } = mountBar();
        cache.addItems([Page.create({ id: "page-1#0001" })]);
        let cachedWhenRead: Page | undefined;
        getPage.execute.mockImplementation(async params => {
            cachedWhenRead = cache.getItem(page => page.id === params.id);
            return Page.create({ id: params.id });
        });
        const reloader = presenter.init.mock.calls[0][0].contentReloader;
        if (!reloader) {
            throw new Error("The init params carry no reloader.");
        }

        await reloader.reload();

        expect(getPage.execute).toHaveBeenCalledTimes(1);
        expect(getPage.execute).toHaveBeenCalledWith({ id: "page-1#0001" });
        // The page was evicted from the full page cache before the read (A96).
        expect(cachedWhenRead).toBeUndefined();
        expect(cache.getItems()).toEqual([]);
    });

    it("disposes the presenter on unmount", () => {
        const { presenter, view } = mountBar();

        view.unmount();

        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });
});
