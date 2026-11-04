import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { EntryProvider } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { MOVE_BLOCKED_IN_REVIEW } from "@webiny/app-workflows/review/presentation/targetReview/moveBlockedInReview.js";
import { CmsReviewMoveEntryAction } from "./CmsReviewMoveEntryAction.js";
import { MODEL } from "~/testing/models.js";

interface FakeActionProps {
    name: string;
    element: React.ReactElement;
}

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
}

vi.mock("@webiny/app-aco", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-aco")>();
    const React = await import("react");
    const Action = Object.assign(
        (props: FakeActionProps) => {
            return React.createElement("div", { "data-action": props.name }, props.element);
        },
        { OptionsMenuItem: () => null, OptionsMenuLink: () => null }
    );

    return {
        ...actual,
        AcoConfig: {
            ...actual.AcoConfig,
            Record: { ...actual.AcoConfig.Record, Action }
        }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement(
                "button",
                { "data-testid": "blocked-move", disabled: props.disabled ?? false },
                props.label
            );
        }
    };
});

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

function createEntry(reviewState: string | null): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status: "draft", version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

function renderActions(entry: CmsContentEntry) {
    return render(
        <AdminUiProvider>
            <CompositionProvider>
                <ModelContext.Provider value={MODEL}>
                    <EntryProvider entry={entry}>
                        <CmsReviewMoveEntryAction />
                        <EntryAction name="move" element={<span data-testid="move-item" />} />
                        <EntryAction name="delete" element={<span data-testid="delete-item" />} />
                    </EntryProvider>
                </ModelContext.Provider>
            </CompositionProvider>
        </AdminUiProvider>
    );
}

describe("CmsReviewMoveEntryAction", () => {
    it("replaces Move with a disabled item and its reason while the review is in progress", async () => {
        renderActions(createEntry(ReviewState.InProgress));

        const blocked = await screen.findByTestId("blocked-move");

        expect(blocked.textContent).toBe("Move");
        expect(blocked.hasAttribute("disabled")).toBe(true);
        expect(screen.queryByTestId("move-item")).toBeNull();
        const describedBy = blocked.closest("[aria-describedby]")?.getAttribute("aria-describedby");
        expect(document.getElementById(describedBy ?? "")?.textContent).toBe(
            MOVE_BLOCKED_IN_REVIEW
        );
    });

    it("leaves the other actions of the same row alone while the review is in progress", async () => {
        renderActions(createEntry(ReviewState.InProgress));

        expect(await screen.findByTestId("delete-item")).toBeTruthy();
    });

    it.each([
        ["approved", ReviewState.Approved],
        ["rejected", ReviewState.Rejected],
        ["cancelled", ReviewState.Cancelled],
        ["missing", null]
    ])("keeps the original Move for a %s review", async (_name, reviewState) => {
        renderActions(createEntry(reviewState));

        expect(await screen.findByTestId("move-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-move")).toBeNull();
    });
});
