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
import { Container } from "@webiny/di";
import { InternalPageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { PageNewRevisionDecorator } from "./PageNewRevisionDecorator.js";

const { Ui } = PageEditorConfig;

const mountNewRevision = (kind: FakeReviewKind, isUnpublished: boolean = false) => {
    const handle = createFakeSession(kind, isUnpublished);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(isUnpublished ? "unpublished" : "published");

    render(
        <WbEditorHarness container={container} editor={editor} groups={["actions"]}>
            <PageNewRevisionDecorator />
            <InternalPageEditorConfig>
                <Ui.TopBar.Action name={"sentinel"} element={<span data-testid={"sentinel"} />} />
                <Ui.TopBar.Action
                    name={"buttonNewRevision"}
                    element={<span data-testid={"new-revision"} />}
                />
                <Ui.TopBar.Action
                    name={"buttonSettings"}
                    element={<span data-testid={"other-action"} />}
                />
            </InternalPageEditorConfig>
        </WbEditorHarness>
    );

    return handle;
};

interface NewRevisionCase {
    kind: FakeReviewKind;
    shown: boolean;
}

const CASES: NewRevisionCase[] = [
    { kind: "loading", shown: false },
    { kind: "failed", shown: false },
    { kind: "noWorkflow", shown: true },
    { kind: "none", shown: true },
    { kind: "inProgress", shown: false },
    { kind: "approved", shown: true },
    { kind: "rejected", shown: true }
];

describe("PageNewRevisionDecorator", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)("$kind review: New Revision shown is $shown", async ({ kind, shown }) => {
        mountNewRevision(kind);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(shown ? 1 : 0);
        });
    });

    it("an unpublished page with no review shows New Revision (Q19)", async () => {
        mountNewRevision("none", true);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(1);
        });
    });

    it("leaves every other top bar action alone", async () => {
        mountNewRevision("inProgress");
        await screen.findByTestId("sentinel");

        expect(screen.queryAllByTestId("other-action")).toHaveLength(1);
    });

    it("follows the review while the editor is open: hidden in progress, shown once rejected (Q17)", async () => {
        const { setKind } = mountNewRevision("inProgress");
        await screen.findByTestId("sentinel");
        expect(screen.queryAllByTestId("new-revision")).toHaveLength(0);

        act(() => {
            setKind("rejected");
        });

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(1);
        });
    });
});
