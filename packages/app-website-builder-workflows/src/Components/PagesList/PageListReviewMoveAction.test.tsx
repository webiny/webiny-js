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
import { AdminUiProvider } from "@webiny/admin-ui";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { MOVE_BLOCKED_IN_REVIEW } from "@webiny/app-workflows/review/presentation/targetReview/moveBlockedInReview.js";
import "~/types.js";
import { PageListReviewMoveAction } from "./PageListReviewMoveAction.js";

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
}

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
        <AdminUiProvider>
            <CompositionProvider>
                <PageProvider page={createDto(reviewState)}>
                    <PageListReviewMoveAction />
                    <Browser.Page.Action
                        name={"moveToFolder"}
                        element={<span data-testid={"move"} />}
                    />
                    <Browser.Page.Action
                        name={"delete"}
                        element={<span data-testid={"delete"} />}
                    />
                </PageProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );
};

describe("PageListReviewMoveAction", () => {
    afterEach(() => {
        cleanup();
    });

    it("replaces Move with a disabled item and its reason while the page is in review", () => {
        mountActions(ReviewState.InProgress);

        const blocked = screen.getByTestId("blocked-move");
        expect(blocked.textContent).toBe("Move");
        expect(blocked.hasAttribute("disabled")).toBe(true);
        expect(screen.queryByTestId("move")).toBeNull();
        const describedBy = blocked.closest("[aria-describedby]")?.getAttribute("aria-describedby");
        expect(document.getElementById(describedBy ?? "")?.textContent).toBe(
            MOVE_BLOCKED_IN_REVIEW
        );
    });

    it("leaves the other row actions alone while the page is in review", () => {
        mountActions(ReviewState.InProgress);

        expect(screen.getByTestId("delete")).toBeTruthy();
    });

    it.each([
        ["approved", ReviewState.Approved],
        ["rejected", ReviewState.Rejected],
        ["missing", null]
    ])("keeps the original Move for a %s review", (_name, reviewState) => {
        mountActions(reviewState);

        expect(screen.getByTestId("move")).toBeTruthy();
        expect(screen.queryByTestId("blocked-move")).toBeNull();
    });
});
