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
import { PageEditorAutoSave } from "./PageEditorAutoSave.js";

const { Ui } = PageEditorConfig;

const mountAutoSave = (kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor("draft");

    render(
        <WbEditorHarness container={container} editor={editor} groups={["left"]}>
            <PageEditorAutoSave />
            <InternalPageEditorConfig>
                <Ui.TopBar.Element
                    group={"left"}
                    name={"sentinel"}
                    element={<span data-testid={"sentinel"} />}
                />
                <Ui.TopBar.Element
                    group={"left"}
                    name={"title"}
                    element={<span data-testid={"title"} />}
                />
                <Ui.TopBar.Element
                    group={"left"}
                    name={"autoSave"}
                    element={<span data-testid={"autosave"} />}
                />
            </InternalPageEditorConfig>
        </WbEditorHarness>
    );

    return handle;
};

interface AutoSaveCase {
    kind: FakeReviewKind;
    on: boolean;
}

const CASES: AutoSaveCase[] = [
    { kind: "loading", on: false },
    { kind: "failed", on: false },
    { kind: "noWorkflow", on: true },
    { kind: "none", on: true },
    { kind: "inProgress", on: false },
    { kind: "approved", on: false },
    { kind: "rejected", on: false }
];

describe("PageEditorAutoSave", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)("$kind review: autosave on is $on", async ({ kind, on }) => {
        mountAutoSave(kind);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(on ? 1 : 0);
        });
    });

    it("leaves every other top bar element alone", async () => {
        mountAutoSave("loading");
        await screen.findByTestId("sentinel");

        expect(screen.queryAllByTestId("title")).toHaveLength(1);
    });

    it("turns autosave off when a review starts and on again when it ends", async () => {
        const { setKind } = mountAutoSave("none");
        await screen.findByTestId("sentinel");
        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(1);
        });

        act(() => {
            setKind("inProgress");
        });
        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(0);
        });

        act(() => {
            setKind("none");
        });
        await waitFor(() => {
            expect(screen.queryAllByTestId("autosave")).toHaveLength(1);
        });
    });
});
