import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { CompositionProvider } from "@webiny/react-composition";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { EntryProvider } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewWorkflow } from "@webiny/app-workflows/review/domain/types.js";
import { GetBoundWorkflowUseCase } from "@webiny/app-workflows/review/useCases/getBoundWorkflow/abstractions.js";
import { CmsModelWorkflowFeature } from "~/presentation/modelWorkflow/feature.js";
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

const WORKFLOW = { id: "workflow-1", namespaces: ["cms.article"] } as unknown as ReviewWorkflow;

function createEntry(reviewState: ReviewStateValue | null, status: string): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status, version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

function renderActions(entry: CmsContentEntry, workflow: ReviewWorkflow | null) {
    const container = new Container();
    const execute = vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>();
    execute.mockResolvedValue(workflow);
    container.registerInstance(GetBoundWorkflowUseCase, { execute });
    CmsModelWorkflowFeature.register(container);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={MODEL}>
                        <EntryProvider entry={entry}>
                            <CmsReviewScheduleEntryAction />
                            <EntryAction
                                name="schedule"
                                element={<span data-testid="schedule-item" />}
                            />
                            <EntryAction
                                name="delete"
                                element={<span data-testid="delete-item" />}
                            />
                        </EntryProvider>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { execute };
}

interface ScheduleCase {
    name: string;
    reviewState: ReviewStateValue | null;
    status: string;
    workflow: ReviewWorkflow | null;
    shown: boolean;
}

const CASES: ScheduleCase[] = [
    {
        name: "a bound draft with no review",
        reviewState: null,
        status: "draft",
        workflow: WORKFLOW,
        shown: false
    },
    {
        name: "an approved review",
        reviewState: ReviewState.Approved,
        status: "draft",
        workflow: WORKFLOW,
        shown: true
    },
    {
        name: "a review in progress",
        reviewState: ReviewState.InProgress,
        status: "draft",
        workflow: WORKFLOW,
        shown: false
    },
    {
        name: "a rejected review",
        reviewState: ReviewState.Rejected,
        status: "draft",
        workflow: WORKFLOW,
        shown: false
    },
    {
        name: "a cancelled review",
        reviewState: ReviewState.Cancelled,
        status: "draft",
        workflow: WORKFLOW,
        shown: false
    },
    {
        name: "a model no workflow binds",
        reviewState: null,
        status: "draft",
        workflow: null,
        shown: true
    },
    {
        name: "a published revision (Schedule unpublish)",
        reviewState: null,
        status: "published",
        workflow: WORKFLOW,
        shown: true
    },
    {
        name: "an unpublished revision with no review (Q19)",
        reviewState: null,
        status: "unpublished",
        workflow: WORKFLOW,
        shown: true
    }
];

describe("CmsReviewScheduleEntryAction", () => {
    it.each(CASES)(
        "$name: Schedule shown is $shown",
        async ({ reviewState, status, workflow, shown }) => {
            const { execute } = renderActions(createEntry(reviewState, status), workflow);

            await waitFor(() => expect(execute).toHaveBeenCalledWith({ namespace: "cms.article" }));
            await waitFor(() => {
                expect(screen.queryAllByTestId("schedule-item")).toHaveLength(shown ? 1 : 0);
            });
            expect(screen.getByTestId("delete-item")).toBeTruthy();
        }
    );
});
