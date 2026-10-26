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
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { CmsReviewScheduleEntryAction } from "./CmsReviewScheduleEntryAction.js";
import { MODEL } from "~/testing/models.js";

interface FakeActionProps {
    name: string;
    element: React.ReactElement;
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

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

function createEntry(reviewState: ReviewStateValue | null): CmsContentEntry {
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
                        <CmsReviewScheduleEntryAction />
                        <EntryAction
                            name="schedule"
                            element={<span data-testid="schedule-item" />}
                        />
                        <EntryAction name="delete" element={<span data-testid="delete-item" />} />
                    </EntryProvider>
                </ModelContext.Provider>
            </CompositionProvider>
        </AdminUiProvider>
    );
}

interface ScheduleCase {
    reviewState: ReviewStateValue | null;
    shown: boolean;
}

const CASES: ScheduleCase[] = [
    { reviewState: null, shown: true },
    { reviewState: ReviewState.Approved, shown: true },
    { reviewState: ReviewState.InProgress, shown: false },
    { reviewState: ReviewState.Rejected, shown: false },
    { reviewState: ReviewState.Cancelled, shown: false }
];

describe("CmsReviewScheduleEntryAction", () => {
    it.each(CASES)(
        "review state $reviewState: Schedule shown is $shown",
        ({ reviewState, shown }) => {
            renderActions(createEntry(reviewState));

            expect(screen.queryAllByTestId("schedule-item")).toHaveLength(shown ? 1 : 0);
            expect(screen.getByTestId("delete-item")).toBeTruthy();
        }
    );
});
