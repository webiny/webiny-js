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
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import { registerPageContent } from "~/testing/registerPageContent.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
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

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

interface MatrixCase {
    kind: FakeReviewKind;
    page: WbStatus;
    bar: boolean;
    note: string | null;
    readOnly: boolean;
}

const MATRIX: MatrixCase[] = [
    { kind: "loading", page: "draft", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "loading", page: "published", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "loading", page: "unpublished", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "failed", page: "draft", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "failed", page: "published", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "failed", page: "unpublished", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "noWorkflow", page: "draft", bar: false, note: null, readOnly: false },
    { kind: "noWorkflow", page: "published", bar: false, note: null, readOnly: true },
    { kind: "noWorkflow", page: "unpublished", bar: false, note: null, readOnly: true },
    { kind: "none", page: "draft", bar: true, note: null, readOnly: false },
    { kind: "none", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "none", page: "unpublished", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "inProgress", page: "draft", bar: true, note: null, readOnly: true },
    { kind: "inProgress", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "inProgress", page: "unpublished", bar: true, note: null, readOnly: true },
    { kind: "approved", page: "draft", bar: true, note: APPROVED, readOnly: true },
    { kind: "approved", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "approved", page: "unpublished", bar: true, note: APPROVED, readOnly: true },
    { kind: "rejected", page: "draft", bar: true, note: REJECTED, readOnly: true },
    { kind: "rejected", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "rejected", page: "unpublished", bar: true, note: REJECTED, readOnly: true }
];

describe("review status x page status (bar, note and canvas)", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(MATRIX)("$kind review on a $page page", ({ kind, page, bar, note, readOnly }) => {
        const handle = createFakeSession(kind, page === "unpublished");
        const container = new Container();
        container.registerInstance(WbPageReview, handle.session);
        registerPageContent(container);
        const editor = createPageEditor(page);

        render(
            <WbEditorHarness container={container} editor={editor}>
                <PageEditorTopBar />
                <PageEditorLayout />
                <Ui.Layout />
                <Ui.TopBar.Layout />
            </WbEditorHarness>
        );

        const bars = screen.queryAllByTestId("review-bar");
        expect(bars).toHaveLength(bar ? 1 : 0);
        const alert = screen.queryByRole("alert");
        if (note === null) {
            expect(alert).toBeNull();
        } else {
            expect(alert?.textContent).toContain(note);
        }
        expect(editor.getEditorState().read().isReadOnly).toBe(readOnly);
    });
});
