### Task 14: Review bar, progress popover, tooltip

R202, R212, R225, R226, R234, R-b, R-c, R-e, R-f, R-k, R-l; D5, D54; QBZ-1, QBZ-36, QBZ-52, QBZ-59, QBZ-64; README 6; Review Focus 3, 4, 12. The components of the review bar. They read the render-ready view model of Task 13 and call its commands; they hold no review logic. `ReviewBar` shows the skeleton while the status loads, the failed alert (with "Try again") after a failed load, nothing for content without a workflow, and otherwise the card: state tile, review state tag, message, meta line, lock text, the server-driven actions and the progress row with the steps popover. The action buttons call `presenter.openAction(kind, stepId)`; Tasks 15 and 17 mount the dialogs inside `ReviewBar` from `vm.openAction`, until then the request is only recorded. `ReviewTooltip` is a wrapper around a disabled app control (Publish) with a render-function child: it gives the control its reason on hover and focus, and hands the control the `aria-describedby` id of an always-present visually hidden reason, so the control itself carries the description (QBZ-36, R-b).

This task also makes component tests possible in `app-workflows` (R222): the vitest config registers no SVG transform and jsdom has no `ResizeObserver`, so it adds a small SVG stub (every `@webiny/icons/*.svg` import resolves to it, verified with a probe: without it `ReactComponent` is `undefined` and rendering an icon throws), a DOM setup file (`ResizeObserver` stub, RTL cleanup) and the rendering helper `renderWithAdminUi` (admin-ui components need `AdminUiProvider`).

**Files:**
- Modify: `packages/app-workflows/vitest.config.ts` (replace the file, shown below)
- Create: `packages/app-workflows/__tests__/setup/setupDom.ts`
- Create: `packages/app-workflows/__tests__/setup/svgStub.tsx`
- Create: `packages/app-workflows/src/review/testing/renderWithAdminUi.tsx`
- Create: `packages/app-workflows/src/review/testing/targetReviewFakes.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBarSkeleton.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBarFailed.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepsPopover.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewProgress.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`
- Create: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.test.tsx`

**Interfaces:**
- Consumes: Task 13 (`TargetReviewPresenter.Interface`, `TargetReviewPresenter.ViewModel` (R-l, the `Foo.Interface` names), the pure builders `~/review/testing/{createActor,createStep,createFlags,createWorkflow,reviewTarget}.js`, `TargetReviewActionVm`, `TargetReviewProgressVm`, `TargetReviewTile`, `TargetReviewActionIcon`, `getStepStateTag`, `createReview` and `createReviewWithFlags` from Task 8's `~/review/testing/reviewFixtures.js`, `createFakeUseCases` from `fakeReviewUseCases.js`); Task 8 (`IReviewUseCases`, `StepState`, `StepStateValue`). Existing (verified): `createReactiveComponent` (`@webiny/app-admin`), admin-ui `Alert` (`Alert.Action`, `type`, `variant`), `Button` (`variant`, `size`, `text`, `icon`, `disabled`), `Icon`, `Popover` (`trigger`, `content`, `open`, `onOpenChange`, `align`), `Skeleton`, `Tag` (`variant`, `content`), `Text`, `Tooltip` (`trigger`, `content`), `AdminUiProvider`, `cn` (all `@webiny/admin-ui`); `@webiny/icons/{send,play_arrow,check,close,front_hand,swap_horiz,block,rule,rate_review,hourglass_empty,sync_problem,check_circle,cancel}.svg` (all present in `packages/icons/dist`).
- Produces: `ReviewBar` props `{ presenter: TargetReviewPresenter.Interface; useCases: IReviewUseCases; reviewsUrl: string | null; onOpenDetails?: () => void }`; `ReviewTooltip` props `{ presenter: TargetReviewPresenter.Interface; children: (describedBy: string | undefined) => React.ReactNode }` (R241: the wrapped control is rendered by the child function); `ReviewStepsPopover`, `ReviewProgress`, `ReviewBarSkeleton`, `ReviewBarFailed`; test helpers `renderWithAdminUi`, `createViewModel`, `createFakePresenter` (reused by Tasks 15-19, 26). Consumed by Tasks 15, 17, 19, 20, 22.

**Test runner note:** admin package: `yarn test <path>` only. `.tsx` tests import `React` (classic JSX runtime).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/__tests__/setup/setupDom.ts`:

```ts
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

// jsdom has no ResizeObserver; Radix dialogs, popovers and tooltips need one.
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
    cleanup();
});
```

Create `packages/app-workflows/__tests__/setup/svgStub.tsx`:

```tsx
import React from "react";

export const ReactComponent = (props: React.SVGProps<SVGSVGElement>) => {
    return <svg data-testid="svg-icon" {...props} />;
};

export default "svg-stub";
```

Create `packages/app-workflows/src/review/testing/renderWithAdminUi.tsx`:

```tsx
import React from "react";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";

/** Renders inside `AdminUiProvider`, which admin-ui components (Alert, Tooltip) require. */
export const renderWithAdminUi = (ui: React.ReactElement): RenderResult => {
    return render(<AdminUiProvider>{ui}</AdminUiProvider>);
};
```

Create `packages/app-workflows/src/review/testing/targetReviewFakes.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

export const createViewModel = (
    overrides: Partial<TargetReviewPresenter.ViewModel> = {}
): TargetReviewPresenter.ViewModel => {
    return {
        status: "active",
        failureKind: null,
        reviewKind: "inProgress",
        targetTitle: "Spring campaign",
        namespace: "cms.article",
        targetRevisionId: "entry-1#0001",
        message: "Luka Perić is reviewing",
        lockText: "Editing, publishing and moving are locked while this revision is in review.",
        tile: "rate_review",
        stateTag: { label: "Review: In progress", variant: "accent-light" },
        stepStateTag: { label: "In review", variant: "accent-light" },
        stepMeta: "Step 2 of 3: Legal sign-off",
        ownerMeta: "Owner: Luka Perić",
        progress: {
            approved: 1,
            total: 3,
            segments: [
                {
                    stepId: "step-1",
                    title: "Editorial check",
                    state: "approved",
                    ownerLabel: "Ivan Horvat",
                    comment: null
                },
                {
                    stepId: "step-2",
                    title: "Legal sign-off",
                    state: "inReview",
                    ownerLabel: "Luka Perić",
                    comment: null
                },
                {
                    stepId: "step-3",
                    title: "Brand check",
                    state: "pending",
                    ownerLabel: "Not reached yet",
                    comment: null
                }
            ]
        },
        actions: [],
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: null,
        moveDisabledReason: null,
        reviewId: "review-1",
        openAction: null,
        busy: false,
        ...overrides
    };
};

export interface FakeTargetReviewPresenter extends TargetReviewPresenter.Interface {
    init: Mock<TargetReviewPresenter.Interface["init"]>;
    setContext: Mock<TargetReviewPresenter.Interface["setContext"]>;
    refresh: Mock<TargetReviewPresenter.Interface["refresh"]>;
    actionDone: Mock<TargetReviewPresenter.Interface["actionDone"]>;
    openAction: Mock<TargetReviewPresenter.Interface["openAction"]>;
    closeAction: Mock<TargetReviewPresenter.Interface["closeAction"]>;
    dispose: Mock<TargetReviewPresenter.Interface["dispose"]>;
}

/** A presenter that exposes a fixed view model and records every command. */
export const createFakePresenter = (
    vm: TargetReviewPresenter.ViewModel = createViewModel()
): FakeTargetReviewPresenter => {
    return {
        vm,
        init: vi.fn().mockResolvedValue(undefined),
        setContext: vi.fn(),
        refresh: vi.fn().mockResolvedValue(undefined),
        actionDone: vi.fn().mockResolvedValue(undefined),
        openAction: vi.fn(),
        closeAction: vi.fn(),
        dispose: vi.fn()
    };
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { ReviewBar } from "./ReviewBar.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { TargetReviewPresenter } from "../abstractions.js";

const renderBar = (vm: TargetReviewPresenter.ViewModel, onOpenDetails?: () => void) => {
    const presenter = createFakePresenter(vm);
    const useCases = createFakeUseCases();
    const result = renderWithAdminUi(
        <ReviewBar
            presenter={presenter}
            useCases={useCases}
            reviewsUrl={null}
            onOpenDetails={onOpenDetails}
        />
    );
    return { presenter, ...result };
};

describe("ReviewBar", () => {
    it("renders nothing for content without a workflow", () => {
        const { container } = renderBar(createViewModel({ status: "noWorkflow", message: "" }));

        expect(container.querySelector("[data-role='review-bar']")).toBeNull();
        expect(screen.queryByText("Loading review status…")).toBeNull();
    });

    it("renders the skeleton with the loading text and no actions (QBZ-1)", () => {
        renderBar(
            createViewModel({
                status: "loading",
                message: "Loading review status…",
                lockText: null,
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText("Loading review status…")).toBeTruthy();
        expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("renders the failed alert with Try again that refreshes the presenter", () => {
        const { presenter } = renderBar(
            createViewModel({
                status: "failed",
                failureKind: "error",
                message: "Could not load the review status",
                lockText: "Editing and publishing are unavailable until it loads.",
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText("Could not load the review status")).toBeTruthy();
        expect(
            screen.getByText("Editing and publishing are unavailable until it loads.")
        ).toBeTruthy();
        fireEvent.click(screen.getByText("Try again"));
        expect(presenter.refresh).toHaveBeenCalledTimes(1);
    });

    it("renders a read without access as a message without Try again", () => {
        renderBar(
            createViewModel({
                status: "failed",
                failureKind: "noAccess",
                message:
                    "You don't have access to this content or its review. Ask an administrator if you need it.",
                lockText: null,
                stateTag: null,
                progress: null
            })
        );

        expect(screen.getByText(/You don't have access to this content/)).toBeTruthy();
        expect(screen.queryByText("Try again")).toBeNull();
    });

    it("renders Request review and records the request", () => {
        const { presenter } = renderBar(
            createViewModel({
                status: "none",
                message: "This content needs review before publishing",
                lockText: "Publishing needs an approved review.",
                tile: "rule",
                stateTag: null,
                stepStateTag: null,
                stepMeta: null,
                ownerMeta: null,
                progress: null,
                reviewId: null,
                actions: [
                    {
                        kind: "request",
                        label: "Request review",
                        icon: "send",
                        stepId: null,
                        emphasis: "primary"
                    }
                ]
            })
        );

        expect(screen.getByText("This content needs review before publishing")).toBeTruthy();
        expect(screen.getByText("Publishing needs an approved review.")).toBeTruthy();
        fireEvent.click(screen.getByText("Request review"));
        expect(presenter.openAction).toHaveBeenCalledWith("request", null);
    });

    it("renders message, tag, meta, lock text and the actions in view model order", () => {
        const { presenter } = renderBar(
            createViewModel({
                actions: [
                    {
                        kind: "cancel",
                        label: "Cancel review",
                        icon: "block",
                        stepId: "step-2",
                        emphasis: "ghost"
                    },
                    {
                        kind: "takeOver",
                        label: "Take over",
                        icon: "front_hand",
                        stepId: "step-2",
                        emphasis: "secondary"
                    },
                    {
                        kind: "approve",
                        label: "Approve",
                        icon: "check",
                        stepId: "step-2",
                        emphasis: "primary"
                    }
                ]
            })
        );

        expect(screen.getByText("Luka Perić is reviewing")).toBeTruthy();
        expect(screen.getByText("Review: In progress")).toBeTruthy();
        expect(screen.getByText("In review")).toBeTruthy();
        expect(screen.getByText("Step 2 of 3: Legal sign-off")).toBeTruthy();
        expect(screen.getByText("Owner: Luka Perić")).toBeTruthy();
        expect(
            screen.getByText(
                "Editing, publishing and moving are locked while this revision is in review."
            )
        ).toBeTruthy();
        const labels = screen
            .getAllByRole("button")
            .map(button => button.textContent)
            .filter(text => ["Cancel review", "Take over", "Approve"].includes(text ?? ""));
        expect(labels).toEqual(["Cancel review", "Take over", "Approve"]);

        fireEvent.click(screen.getByText("Take over"));
        expect(presenter.openAction).toHaveBeenCalledWith("takeOver", "step-2");
    });

    it("shows the progress count and opens Review details only when a handler is passed", () => {
        const onOpenDetails = vi.fn();
        const first = renderBar(createViewModel(), onOpenDetails);

        expect(screen.getByText("1 of 3 steps approved")).toBeTruthy();
        fireEvent.click(screen.getByText("Review details"));
        expect(onOpenDetails).toHaveBeenCalledTimes(1);
        first.unmount();

        renderBar(createViewModel());
        expect(screen.queryByText("Review details")).toBeNull();
    });

    it("disables the actions while busy", () => {
        const { presenter } = renderBar(
            createViewModel({
                busy: true,
                actions: [
                    {
                        kind: "approve",
                        label: "Approve",
                        icon: "check",
                        stepId: "step-2",
                        emphasis: "primary"
                    }
                ]
            })
        );

        const button = screen.getByText("Approve").closest("button");
        expect(button?.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(screen.getByText("Approve"));
        expect(presenter.openAction).not.toHaveBeenCalled();
    });

    it("lists all six step states with owner and the full comment in the popover (QBZ-64)", () => {
        const longComment = "x".repeat(120);
        renderBar(
            createViewModel({
                progress: {
                    approved: 1,
                    total: 6,
                    segments: [
                        {
                            stepId: "s1",
                            title: "Step pending",
                            state: "pending",
                            ownerLabel: "Not reached yet",
                            comment: null
                        },
                        {
                            stepId: "s2",
                            title: "Step awaiting",
                            state: "awaiting",
                            ownerLabel: "Team pool (Legal)",
                            comment: null
                        },
                        {
                            stepId: "s3",
                            title: "Step in review",
                            state: "inReview",
                            ownerLabel: "Luka Perić",
                            comment: null
                        },
                        {
                            stepId: "s4",
                            title: "Step approved",
                            state: "approved",
                            ownerLabel: "Ivan Horvat",
                            comment: "Looks fine."
                        },
                        {
                            stepId: "s5",
                            title: "Step rejected",
                            state: "rejected",
                            ownerLabel: "Ana Legal",
                            comment: longComment
                        },
                        {
                            stepId: "s6",
                            title: "Step failed",
                            state: "failed",
                            ownerLabel: "Step failed",
                            comment: null
                        }
                    ]
                }
            })
        );

        fireEvent.click(screen.getByText("1 of 6 steps approved"));

        const popover = document.querySelector("[data-slot='popover-content']") as HTMLElement;
        const view = within(popover);
        ["Pending", "Awaiting", "In review", "Approved", "Rejected", "Failed"].forEach(label => {
            expect(view.getByText(label)).toBeTruthy();
        });
        expect(view.getByText("Team pool (Legal)")).toBeTruthy();
        expect(view.getByText("Ivan Horvat")).toBeTruthy();
        expect(view.getByText("“Looks fine.”")).toBeTruthy();
        expect(view.getByText(`“${longComment}”`)).toBeTruthy();
    });

    it("opens the popover on hover", () => {
        renderBar(createViewModel());

        fireEvent.mouseEnter(screen.getByText("1 of 3 steps approved"));

        expect(document.querySelector("[data-slot='popover-content']")).not.toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { ReviewTooltip } from "./ReviewTooltip.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createFakePresenter } from "~/review/testing/targetReviewFakes.js";
import { createViewModel } from "~/review/testing/targetReviewFakes.js";

const REASON = "The review status could not be loaded. Try again from the review bar.";

describe("ReviewTooltip", () => {
    it("renders only the control, without a description, when nothing is disabled", () => {
        const presenter = createFakePresenter(createViewModel({ publishDisabledReason: null }));

        renderWithAdminUi(
            <ReviewTooltip presenter={presenter}>
                {describedBy => (
                    <button type="button" aria-describedby={describedBy}>
                        Publish
                    </button>
                )}
            </ReviewTooltip>
        );

        expect(screen.getByText("Publish").getAttribute("aria-describedby")).toBeNull();
    });

    it("puts aria-describedby on the control itself, pointing at the hidden reason (QBZ-36)", () => {
        const presenter = createFakePresenter(createViewModel({ publishDisabledReason: REASON }));

        renderWithAdminUi(
            <ReviewTooltip presenter={presenter}>
                {describedBy => (
                    <button type="button" aria-disabled="true" aria-describedby={describedBy}>
                        Publish
                    </button>
                )}
            </ReviewTooltip>
        );

        const button = screen.getByText("Publish");
        const description = document.getElementById(button.getAttribute("aria-describedby") ?? "");
        expect(description?.textContent).toBe(REASON);
        expect(description?.className).toContain("sr-only");
    });

    it("shows the reason when the control receives focus", async () => {
        const presenter = createFakePresenter(createViewModel({ publishDisabledReason: REASON }));

        renderWithAdminUi(
            <ReviewTooltip presenter={presenter}>
                {describedBy => (
                    <button type="button" aria-disabled="true" aria-describedby={describedBy}>
                        Publish
                    </button>
                )}
            </ReviewTooltip>
        );
        fireEvent.focus(screen.getByText("Publish"));

        const matches = await screen.findAllByText(REASON);
        expect(matches.length).toBeGreaterThan(1);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.test.tsx 2>&1 | tail -30
```

Expected: both fail with `Failed to resolve import "./ReviewBar.js"` / `"./ReviewTooltip.js"` (and for the helpers if Step 3 is not applied). Record the RED output.

- [ ] **Step 3: Implement**

Replace `packages/app-workflows/vitest.config.ts` (Task 8 created it as the copy of `packages/app-admin/vitest.config.ts`; the change adds the DOM setup file and the SVG alias; `createTestConfig` returns the `test` section, so `alias` and `presets` are the supported hooks, `plugins` would be dropped):

```ts
import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        presets: [{ setupFiles: [`${import.meta.dirname}/__tests__/setup/setupDom.ts`] }],
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true,
            alias: [
                {
                    find: /^@webiny\/icons\/.+\.svg$/,
                    replacement: `${import.meta.dirname}/__tests__/setup/svgStub.tsx`
                }
            ]
        }
    });
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts`:

```ts
import type { ComponentType } from "react";
import type { SVGProps } from "react";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as FrontHandIcon } from "@webiny/icons/front_hand.svg";
import { ReactComponent as SwapHorizIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as RuleIcon } from "@webiny/icons/rule.svg";
import { ReactComponent as RateReviewIcon } from "@webiny/icons/rate_review.svg";
import { ReactComponent as HourglassEmptyIcon } from "@webiny/icons/hourglass_empty.svg";
import { ReactComponent as SyncProblemIcon } from "@webiny/icons/sync_problem.svg";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as CancelIcon } from "@webiny/icons/cancel.svg";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewActionIcon } from "../abstractions.js";
import type { TargetReviewTile } from "../abstractions.js";

type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const REVIEW_ACTION_ICONS: Record<TargetReviewActionIcon, SvgComponent> = {
    send: SendIcon,
    play_arrow: PlayArrowIcon,
    check: CheckIcon,
    close: CloseIcon,
    front_hand: FrontHandIcon,
    swap_horiz: SwapHorizIcon,
    block: BlockIcon
};

export const REVIEW_TILE_ICONS: Record<TargetReviewTile, SvgComponent> = {
    rule: RuleIcon,
    rate_review: RateReviewIcon,
    hourglass_empty: HourglassEmptyIcon,
    sync_problem: SyncProblemIcon,
    check_circle: CheckCircleIcon,
    cancel: CancelIcon
};

/** README 6: the 32px state tile colours. */
export const REVIEW_TILE_CLASSES: Record<TargetReviewTile, string> = {
    rule: "bg-neutral-dimmed",
    rate_review: "bg-primary-subtle",
    hourglass_empty: "bg-warning-subtle",
    sync_problem: "bg-destructive-subtle",
    check_circle: "bg-success-subtle",
    cancel: "bg-destructive-subtle"
};

/** README 11: progress segment fills. */
export const REVIEW_SEGMENT_CLASSES: Record<StepStateValue, string> = {
    [StepState.Pending]: "bg-neutral-muted",
    [StepState.Awaiting]: "bg-warning",
    [StepState.InReview]: "bg-primary",
    [StepState.Approved]: "bg-success",
    [StepState.Rejected]: "bg-destructive",
    [StepState.Failed]: "bg-neutral-base border-sm border-destructive-default"
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBarSkeleton.tsx`:

```tsx
import React from "react";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";

/** The bar while the review status loads (QBZ-1): a tile, two lines and the loading text. */
export const ReviewBarSkeleton = () => {
    return (
        <div
            data-role="review-bar-skeleton"
            role="status"
            aria-busy="true"
            className={"mx-md my-md flex items-center gap-sm-plus rounded-lg bg-neutral-base p-md shadow-sm"}
        >
            <Skeleton type={"area"} className={"h-[32px] w-[32px] shrink-0"} />
            <div className={"flex grow flex-col gap-xs"}>
                <Skeleton type={"text"} size={"sm"} className={"w-1/3"} />
                <Skeleton type={"text"} size={"xs"} className={"w-2/3"} />
            </div>
            <Text size={"sm"}>{"Loading review status…"}</Text>
        </div>
    );
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBarFailed.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewBarFailedProps {
    presenter: TargetReviewPresenter.Interface;
}

/**
 * A failed load (QBZ-1): the title, the lock text and Try again. A read without access (R225) is a
 * plain message with no retry.
 */
export const ReviewBarFailed = createReactiveComponent(function ReviewBarFailed(
    props: ReviewBarFailedProps
) {
    const { presenter } = props;
    const { vm } = presenter;

    if (vm.failureKind === "noAccess") {
        return (
            <div className={"mx-md my-md"}>
                <Alert type={"info"} variant={"subtle"}>
                    {vm.message}
                </Alert>
            </div>
        );
    }

    return (
        <div className={"mx-md my-md"}>
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={
                    <Alert.Action
                        text={"Try again"}
                        disabled={vm.busy}
                        onClick={() => presenter.refresh()}
                    />
                }
            >
                <div className={"font-semibold"}>{vm.message}</div>
                <div>{vm.lockText}</div>
            </Alert>
        </div>
    );
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewStepsPopover.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { Popover } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { getStepStateTag } from "../getStepStateTag.js";

export interface ReviewStepsPopoverProps {
    progress: TargetReviewProgressVm;
    children: React.ReactNode;
}

/**
 * The steps popover (README 6): every step's state, owner and the full comment. Opens on hover
 * and on click or keyboard (the trigger is a button); `useState` holds one visual flag only.
 */
export const ReviewStepsPopover = (props: ReviewStepsPopoverProps) => {
    const { progress, children } = props;
    const [open, setOpen] = useState(false);

    const content = (
        <ul className={"m-none flex min-w-[280px] list-none flex-col gap-sm-plus p-none"}>
            {progress.segments.map(segment => {
                const tag = getStepStateTag(segment.state);
                return (
                    <li key={segment.stepId} className={"flex flex-col gap-xs"}>
                        <div className={"flex items-center gap-sm"}>
                            <Text size={"md"} className={"font-semibold"}>
                                {segment.title}
                            </Text>
                            <Tag variant={tag.variant} content={tag.label} />
                        </div>
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {segment.ownerLabel}
                        </Text>
                        {segment.comment ? (
                            <Text size={"sm"}>{`“${segment.comment}”`}</Text>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            align={"start"}
            content={content}
            trigger={
                <button
                    type={"button"}
                    className={"flex cursor-pointer items-center gap-sm-plus bg-transparent p-none"}
                    onMouseEnter={() => setOpen(true)}
                >
                    {children}
                </button>
            }
        />
    );
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewProgress.tsx`:

```tsx
import React from "react";
import { cn } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { TargetReviewProgressVm } from "../abstractions.js";
import { REVIEW_SEGMENT_CLASSES } from "./reviewBarAppearance.js";
import { ReviewStepsPopover } from "./ReviewStepsPopover.js";

export interface ReviewProgressProps {
    progress: TargetReviewProgressVm;
}

/** Row 2 of the bar: 40x6 segments per step and "n of N steps approved" (README 6). */
export const ReviewProgress = (props: ReviewProgressProps) => {
    const { progress } = props;

    return (
        <ReviewStepsPopover progress={progress}>
            <span className={"flex gap-xs"}>
                {progress.segments.map(segment => (
                    <span
                        key={segment.stepId}
                        className={cn(
                            "h-[6px] w-[40px] rounded-full",
                            REVIEW_SEGMENT_CLASSES[segment.state]
                        )}
                    />
                ))}
            </span>
            <Text size={"sm"} className={"text-neutral-strong"}>
                {`${progress.approved} of ${progress.total} steps approved`}
            </Text>
        </ReviewStepsPopover>
    );
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.tsx`:

```tsx
import React from "react";
import { useId } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Tooltip } from "@webiny/admin-ui";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewTooltipProps {
    presenter: TargetReviewPresenter.Interface;
    /**
     * Renders the disabled control. The control itself must carry the `aria-describedby` it is
     * given (undefined when there is no reason), so a screen reader reads the reason from the
     * control and not from a wrapper (QBZ-36).
     */
    children: (describedBy: string | undefined) => React.ReactNode;
}

/**
 * Gives a disabled app control (Publish) its reason on hover and focus (QBZ-36), and describes it
 * through a visually hidden element that is always present while a reason exists. The control
 * stays `aria-disabled` and focusable; the app renders it.
 */
export const ReviewTooltip = createReactiveComponent(function ReviewTooltip(
    props: ReviewTooltipProps
) {
    const { presenter, children } = props;
    const descriptionId = useId();
    const reason = presenter.vm.publishDisabledReason;

    if (reason === null) {
        return <>{children(undefined)}</>;
    }

    return (
        <>
            <Tooltip trigger={children(descriptionId)} content={reason} />
            <span id={descriptionId} className={"sr-only"}>
                {reason}
            </span>
        </>
    );
});
```

Create `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";
import { REVIEW_TILE_CLASSES } from "./reviewBarAppearance.js";
import { REVIEW_TILE_ICONS } from "./reviewBarAppearance.js";
import { ReviewBarFailed } from "./ReviewBarFailed.js";
import { ReviewBarSkeleton } from "./ReviewBarSkeleton.js";
import { ReviewProgress } from "./ReviewProgress.js";
import type { TargetReviewPresenter } from "../abstractions.js";

export interface ReviewBarProps {
    presenter: TargetReviewPresenter.Interface;
    /** Used by the action dialogs mounted in Tasks 15 and 17. */
    useCases: IReviewUseCases;
    reviewsUrl: string | null;
    onOpenDetails?: () => void;
}

/**
 * The review bar card (README 6, UI-6, UI-7): state tile, review state tag, message, meta, lock
 * text, the actions the server allows and the progress row.
 */
export const ReviewBar = createReactiveComponent(function ReviewBar(props: ReviewBarProps) {
    const { presenter, onOpenDetails } = props;
    const { vm } = presenter;

    if (vm.status === "noWorkflow") {
        return null;
    }
    if (vm.status === "loading") {
        return <ReviewBarSkeleton />;
    }
    if (vm.status === "failed") {
        return <ReviewBarFailed presenter={presenter} />;
    }

    const TileIcon = REVIEW_TILE_ICONS[vm.tile];

    return (
        <div
            data-role={"review-bar"}
            className={"mx-md my-md flex flex-col gap-sm-plus rounded-lg bg-neutral-base p-md shadow-sm"}
        >
            <div className={"flex items-start gap-sm-plus"}>
                <div
                    className={cn(
                        "flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-md",
                        REVIEW_TILE_CLASSES[vm.tile]
                    )}
                >
                    <Icon icon={<TileIcon />} label={""} size={"md"} />
                </div>
                <div className={"flex min-w-0 grow flex-col gap-xs"}>
                    <div className={"flex flex-wrap items-center gap-sm"}>
                        {vm.stateTag ? (
                            <Tag variant={vm.stateTag.variant} content={vm.stateTag.label} />
                        ) : null}
                        <Text size={"md"} className={"font-semibold"}>
                            {vm.message}
                        </Text>
                    </div>
                    <div className={"flex flex-wrap items-center gap-sm-plus text-sm text-neutral-strong"}>
                        {vm.stepMeta ? <span>{vm.stepMeta}</span> : null}
                        {vm.stepStateTag ? (
                            <Tag variant={vm.stepStateTag.variant} content={vm.stepStateTag.label} />
                        ) : null}
                        {vm.ownerMeta ? <span>{vm.ownerMeta}</span> : null}
                    </div>
                    {vm.lockText ? (
                        <Text size={"sm"} className={"text-neutral-strong"}>
                            {vm.lockText}
                        </Text>
                    ) : null}
                </div>
                <div className={"flex flex-wrap items-center justify-end gap-sm"}>
                    {vm.actions.map(action => {
                        const ActionIcon = REVIEW_ACTION_ICONS[action.icon];
                        return (
                            <Button
                                key={action.kind}
                                variant={action.emphasis}
                                size={"md"}
                                text={action.label}
                                icon={<ActionIcon />}
                                disabled={vm.busy}
                                onClick={() => presenter.openAction(action.kind, action.stepId)}
                            />
                        );
                    })}
                </div>
            </div>
            {vm.progress ? (
                <div className={"flex items-center justify-between gap-sm"}>
                    <ReviewProgress progress={vm.progress} />
                    {onOpenDetails ? (
                        <Button
                            variant={"ghost"}
                            size={"sm"}
                            text={"Review details"}
                            onClick={onOpenDetails}
                        />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.test.tsx 2>&1 | tail -30
```

Expected: PASS. If `Button` with `disabled` does not set `aria-disabled` in the test ("disables the actions while busy"), read `packages/admin-ui/src/Button/Button.tsx` (`ButtonBase`) and assert the attribute it really sets; the behaviour (no `openAction` call) stays.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx packages/app-workflows/src/review/presentation/targetReview/components/ReviewTooltip.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors (R-e: `yarn build` is the type check, `yarn check:test:types` does not apply to co-located tests, see Task 13 Step 5). Verify visually in the running admin before the sub-phase review (Tailwind token classes such as `bg-primary-subtle`, `border-destructive-default` are taken from admin-ui sources but unit tests cannot show them).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the review bar, progress popover and tooltip" -m "The bar renders the Task 13 view model: skeleton, failed alert with Try again, the state tile and tag, message, meta, lock text, server-driven actions and the steps popover. ReviewTooltip keeps a disabled control focusable and describes it through aria-describedby. The vitest config gains an SVG stub alias and a DOM setup file so components can render in jsdom." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- The progress segment fills follow README 11 (`REVIEW_SEGMENT_CLASSES`, the design's colours); the step state *tags* come from Task 13's `getStepStateTag`, where only `failed` is red (R239).
- The bar's meta line has no coloured step dot (the view model carries no step colour); added only if a later task adds `stepColor`. The state tile icon is decorative (`label={""}`); the message beside it says the same in text.
