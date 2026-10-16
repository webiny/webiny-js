import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CompositionProvider } from "@webiny/react-composition";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import "~/types.js";
import { PageListChangeStatus } from "./PageListChangeStatus.js";

vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageList/configs/Browser/PageAction.js",
    async () => {
        const { makeDecoratable } = await import("@webiny/react-composition");
        interface StubProps {
            name: string;
            element?: React.ReactElement;
        }
        const PageAction = makeDecoratable("PageAction", (props: StubProps) => {
            return props.element ?? null;
        });
        return { PageAction };
    }
);

const { Browser } = PageListConfig;

const createDto = (reviewState: ReviewStateValue | null) => {
    const system =
        reviewState === null
            ? null
            : {
                  workflow: {
                      workflowId: "workflow-1",
                      reviewState,
                      stepId: "step-1",
                      stepName: "Legal",
                      stepState: StepState.InReview
                  }
              };
    const page = Page.create({ id: "page-1#0001", entryId: "page-1", system });
    return PageDtoMapper.toDTO(page);
};

const mountActions = (reviewState: ReviewStateValue | null) => {
    render(
        <CompositionProvider>
            <PageProvider page={createDto(reviewState)}>
                <PageListChangeStatus />
                <Browser.Page.Action
                    name={"changeStatus"}
                    element={<span data-testid={"change-status"} />}
                />
                <Browser.Page.Action name={"edit"} element={<span data-testid={"edit"} />} />
            </PageProvider>
        </CompositionProvider>
    );
};

interface GateCase {
    reviewState: ReviewStateValue | null;
    visible: boolean;
}

const CASES: GateCase[] = [
    { reviewState: null, visible: true },
    { reviewState: ReviewState.Approved, visible: true },
    { reviewState: ReviewState.InProgress, visible: false },
    { reviewState: ReviewState.Rejected, visible: false },
    { reviewState: ReviewState.Cancelled, visible: false }
];

describe("PageListChangeStatus", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)(
        "review state $reviewState: Change status visible is $visible",
        ({ reviewState, visible }) => {
            mountActions(reviewState);

            expect(screen.queryAllByTestId("change-status")).toHaveLength(visible ? 1 : 0);
        }
    );

    it("leaves every other row action alone", () => {
        mountActions(ReviewState.InProgress);

        expect(screen.queryAllByTestId("edit")).toHaveLength(1);
    });
});
