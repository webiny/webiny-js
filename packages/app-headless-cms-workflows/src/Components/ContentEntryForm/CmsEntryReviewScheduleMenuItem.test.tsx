import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { CmsEntryReviewScheduleMenuItem } from "./CmsEntryReviewScheduleMenuItem.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { BOUND_UNPUBLISHED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";

const { Actions } = ContentEntryEditorConfig;

function renderMenu(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({
        ...params,
        children: (
            <>
                <CmsEntryReviewScheduleMenuItem />
                <ContentEntryEditorConfig>
                    <Actions.MenuItemAction
                        name="schedule"
                        element={<span data-testid="schedule-item" />}
                    />
                    <Actions.MenuItemAction
                        name="delete"
                        element={<span data-testid="delete-item" />}
                    />
                </ContentEntryEditorConfig>
            </>
        )
    });
}

describe("CmsEntryReviewScheduleMenuItem", () => {
    it.each([
        ["no workflow", NO_WORKFLOW],
        ["an approved review", APPROVED],
        ["an unpublished revision with no review (Q19)", BOUND_UNPUBLISHED]
    ])("keeps schedule for %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        expect(await screen.findByTestId("schedule-item")).toBeTruthy();
        expect(screen.getByTestId("delete-item")).toBeTruthy();
    });

    it.each([
        ["a bound workflow and no review", BOUND_NO_REVIEW],
        ["a review in progress", IN_REVIEW],
        ["an unknown status", LOADING]
    ])("hides schedule, and only schedule, for %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        expect(await screen.findByTestId("delete-item")).toBeTruthy();
        await waitFor(() => expect(screen.queryByTestId("schedule-item")).toBeNull());
    });

    it("keeps schedule for a new entry", async () => {
        renderMenu({ formVm: { entry: null, isNewEntry: true }, reviewVm: LOADING });

        expect(await screen.findByTestId("schedule-item")).toBeTruthy();
    });
});
