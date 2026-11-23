import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { CompositionProvider } from "@webiny/react-composition";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageDtoMapper } from "@webiny/app-website-builder/domain/Page/index.js";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { PageProvider } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { ReviewWorkflow } from "@webiny/app-workflows/review/domain/types.js";
import { GetBoundWorkflowUseCase } from "@webiny/app-workflows/review/useCases/getBoundWorkflow/abstractions.js";
import { BoundWorkflowFeature } from "@webiny/app-workflows/review/presentation/boundWorkflow/feature.js";
import "~/types.js";
import { PageListReviewGatedActions } from "./PageListReviewGatedActions.js";

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
}

interface ChildrenProps {
    children?: React.ReactNode;
}

const permission = vi.hoisted(() => {
    return { canPublish: true };
});

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

vi.mock("@webiny/app-website-builder/presentation/security/HasPermission.js", () => {
    return {
        HasPermission: (props: ChildrenProps) => {
            return permission.canPublish ? props.children : null;
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
                { "data-testid": "blocked-publish", disabled: props.disabled ?? false },
                props.label
            );
        }
    };
});

const { Browser } = PageListConfig;

const WORKFLOW = { id: "workflow-1", namespaces: ["wb.page"] } as unknown as ReviewWorkflow;

const IN_REVIEW_REASON =
    "This revision is in review. Publishing is allowed once every step approves.";
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
const REJECTED_REASON =
    "This revision was rejected. Create a new revision to fix it, then request a new review.";

const createDto = (reviewState: ReviewStateValue | null, status: WbStatus) => {
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
    const page = Page.create({ id: "page-1#0001", entryId: "page-1", status, system });
    return PageDtoMapper.toDTO(page);
};

interface MountParams {
    reviewState: ReviewStateValue | null;
    workflow: ReviewWorkflow | null;
    status?: WbStatus;
}

const mountActions = (params: MountParams) => {
    const container = new Container();
    const execute = vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>();
    execute.mockResolvedValue(params.workflow);
    container.registerInstance(GetBoundWorkflowUseCase, { execute });
    BoundWorkflowFeature.register(container);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <PageProvider page={createDto(params.reviewState, params.status ?? "draft")}>
                        <PageListReviewGatedActions />
                        <Browser.Page.Action
                            name={"changeStatus"}
                            element={<span data-testid={"change-status"} />}
                        />
                        <Browser.Page.Action
                            name={"page-schedule"}
                            element={<span data-testid={"schedule"} />}
                        />
                        <Browser.Page.Action
                            name={"edit"}
                            element={<span data-testid={"edit"} />}
                        />
                    </PageProvider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { execute };
};

function getDescription(element: HTMLElement): string | undefined {
    const describedBy = element.closest("[aria-describedby]")?.getAttribute("aria-describedby");
    return document.getElementById(describedBy ?? "")?.textContent ?? undefined;
}

interface BlockedCase {
    name: string;
    reviewState: ReviewStateValue | null;
    reason: string;
}

const BLOCKED: BlockedCase[] = [
    { name: "in progress", reviewState: ReviewState.InProgress, reason: IN_REVIEW_REASON },
    { name: "rejected", reviewState: ReviewState.Rejected, reason: REJECTED_REASON },
    { name: "missing", reviewState: null, reason: NEEDS_REVIEW },
    { name: "cancelled", reviewState: ReviewState.Cancelled, reason: NEEDS_REVIEW }
];

describe("PageListReviewGatedActions", () => {
    beforeEach(() => {
        permission.canPublish = true;
    });

    afterEach(() => {
        cleanup();
    });

    it.each(BLOCKED)(
        "review $name with a bound workflow: Publish disabled with its reason, Schedule hidden",
        async ({ reviewState, reason }) => {
            mountActions({ reviewState, workflow: WORKFLOW });

            await waitFor(() => {
                expect(getDescription(screen.getByTestId("blocked-publish"))).toBe(reason);
            });
            const blocked = screen.getByTestId("blocked-publish");
            expect(blocked.textContent).toBe("Publish");
            expect(blocked.hasAttribute("disabled")).toBe(true);
            expect(screen.queryByTestId("change-status")).toBeNull();
            expect(screen.queryByTestId("schedule")).toBeNull();
            expect(screen.getByTestId("edit")).toBeTruthy();
        }
    );

    it("keeps Change status and Schedule for an approved review", async () => {
        const { execute } = mountActions({
            reviewState: ReviewState.Approved,
            workflow: WORKFLOW
        });

        await waitFor(() => expect(execute).toHaveBeenCalledWith({ namespace: "wb.page" }));
        expect(await screen.findByTestId("change-status")).toBeTruthy();
        expect(screen.getByTestId("schedule")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("keeps Change status and Schedule for a page with no review when no workflow exists", async () => {
        mountActions({ reviewState: null, workflow: null });

        expect(await screen.findByTestId("change-status")).toBeTruthy();
        expect(screen.getByTestId("schedule")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("keeps Change status and Schedule for an unpublished page with no review", async () => {
        mountActions({ reviewState: null, workflow: WORKFLOW, status: "unpublished" });

        expect(await screen.findByTestId("change-status")).toBeTruthy();
        expect(screen.getByTestId("schedule")).toBeTruthy();
    });

    it("keeps Unpublish and Schedule unpublish of a published page", async () => {
        mountActions({
            reviewState: ReviewState.InProgress,
            workflow: WORKFLOW,
            status: "published"
        });

        expect(await screen.findByTestId("change-status")).toBeTruthy();
        expect(screen.getByTestId("schedule")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("shows no disabled Publish without the publish permission", async () => {
        permission.canPublish = false;
        const { execute } = mountActions({ reviewState: null, workflow: WORKFLOW });

        await waitFor(() => expect(execute).toHaveBeenCalled());
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
        expect(screen.queryByTestId("change-status")).toBeNull();
    });

    it("hides Schedule while the bound workflow is still being checked", () => {
        mountActions({ reviewState: ReviewState.Approved, workflow: WORKFLOW });

        expect(screen.queryByTestId("schedule")).toBeNull();
    });
});
