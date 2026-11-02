import React from "react";
import { act } from "@testing-library/react";
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
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { PageEditorLayout } from "./PageEditorLayout.js";

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

const { Ui } = PageEditorConfig;

const mountLayout = (pageStatus: WbStatus, kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(pageStatus);

    render(
        <WbEditorHarness container={container} editor={editor}>
            <PageEditorLayout />
            <Ui.Layout />
        </WbEditorHarness>
    );

    return { ...handle, editor };
};

interface ReadOnlyCase {
    kind: FakeReviewKind;
    page: WbStatus;
    readOnly: boolean;
}

const CASES: ReadOnlyCase[] = [
    { kind: "loading", page: "draft", readOnly: true },
    { kind: "failed", page: "draft", readOnly: true },
    { kind: "noWorkflow", page: "draft", readOnly: false },
    { kind: "none", page: "draft", readOnly: false },
    { kind: "inProgress", page: "draft", readOnly: true },
    { kind: "approved", page: "draft", readOnly: true },
    { kind: "rejected", page: "draft", readOnly: true },
    { kind: "noWorkflow", page: "published", readOnly: true },
    { kind: "none", page: "published", readOnly: true },
    { kind: "none", page: "unpublished", readOnly: true }
];

describe("PageEditorLayout", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the original layout", () => {
        mountLayout("draft", "none");

        expect(screen.getAllByTestId("base-layout")).toHaveLength(1);
    });

    it.each(CASES)(
        "$kind review on a $page page: canvas read-only is $readOnly",
        ({ kind, page, readOnly }) => {
            const { editor } = mountLayout(page, kind);

            expect(editor.getEditorState().read().isReadOnly).toBe(readOnly);
        }
    );

    it("follows the review state while the editor is open (the one source of the flag)", () => {
        const { editor, setKind } = mountLayout("draft", "none");
        expect(editor.getEditorState().read().isReadOnly).toBe(false);

        act(() => {
            setKind("inProgress");
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(true);

        act(() => {
            setKind("none");
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(false);
    });

    it("never opens a canvas the editor was created read-only", () => {
        const { editor, setKind } = mountLayout("published", "none");

        act(() => {
            setKind("noWorkflow");
        });

        expect(editor.getEditorState().read().isReadOnly).toBe(true);
    });
});
