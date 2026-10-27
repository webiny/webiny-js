import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
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
import { PageScheduleDecorator } from "./PageScheduleDecorator.js";

const { Ui } = PageEditorConfig;

const mountSchedule = (kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);

    render(
        <WbEditorHarness
            container={container}
            editor={createPageEditor("draft")}
            groups={["dropdownActions"]}
        >
            <PageScheduleDecorator />
            <InternalPageEditorConfig>
                <Ui.TopBar.DropdownAction
                    name={"scheduler"}
                    element={<span data-testid={"schedule"} />}
                />
                <Ui.TopBar.DropdownAction
                    name={"other"}
                    element={<span data-testid={"other-action"} />}
                />
            </InternalPageEditorConfig>
        </WbEditorHarness>
    );
};

interface ScheduleCase {
    kind: FakeReviewKind;
    shown: boolean;
}

const CASES: ScheduleCase[] = [
    { kind: "loading", shown: false },
    { kind: "failed", shown: false },
    { kind: "noWorkflow", shown: true },
    { kind: "none", shown: false },
    { kind: "inProgress", shown: false },
    { kind: "approved", shown: true },
    { kind: "rejected", shown: false }
];

describe("PageScheduleDecorator", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)("$kind review: Schedule shown is $shown", async ({ kind, shown }) => {
        mountSchedule(kind);
        // The other action renders in the same pass, so the Schedule count is settled.
        await screen.findByTestId("other-action");

        expect(screen.queryAllByTestId("schedule")).toHaveLength(shown ? 1 : 0);
    });
});
