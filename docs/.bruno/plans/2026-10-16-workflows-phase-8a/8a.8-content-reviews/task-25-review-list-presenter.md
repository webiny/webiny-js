### Task 25: `ReviewListPresenter`

Spec 13.5; R206, R210, R212, R229, R234, A74; Decisions D112, D113, D119; design README 8, QBZ-69..73, QBZ-71, QBZ-79, QBZ-86. One transient presenter per list view (D71, R212) that owns the Content Reviews list state over app-neutral rows. It never knows an app: row links, content-type labels and the use cases of a row come from an injected `IReviewRowProvider` (R206), and an unbound namespace degrades to no link and no actions (Review Focus 13).

- **Tabs and sort (R229, QBZ-69):** four tabs (`assignedToMe`, `pool`, `teamInReview`, `myRequests`; no Failed steps tab, 8b). The list kind is the tab. Default sort is `lastChangedOn_ASC` (oldest first) on the three work queues and `lastChangedOn_DESC` on My requests; `toggleSort` flips it; a tab switch resets sort, search and all filters.
- **Filters (R229):** `search` (trimmed, empty sends nothing) -> `where.titleContains`; content type -> `where.modelId` (the view only offers it where the app has a content-type filter); review state and step state are sent **only on My requests**.
- **Paging (R229):** first page `REVIEW_LIST_PAGE_SIZE`; `loadMore` passes the `cursor` and appends rows it does not know; `hasMore` is the server's `hasMoreItems` (a page can be short or empty with it true); no totals.
- **Live updates (R210, QBZ-71, QBZ-86):** the presenter subscribes to `ReviewActivity` for its `namespaces`. Every signal (own or remote) triggers exactly one background refetch of the visible window (`max(loaded rows, page size)`, capped at the server maximum 100); signals that arrive while a refetch is in flight collapse into one follow-up refetch, so changes are never hidden and requests never run in parallel. Merge: rows already listed update in place and are `highlighted` when the review changed (step, step state, owner, review state or last change); rows missing from the refetch become `leaving: true` (the view fades them and calls `removeLeavingRow` on transition end), **except** that when the refetch says `hasMoreItems` a missing row that sorts after the last returned row is kept, because the window may simply have pushed it out (a new row at the top of a full page must not fade the last row); rows not listed before are held back and only raise `notice: "New reviews are available."` until `showNewReviews()` reloads the first page, where they appear `highlighted`. No polling and no timers in the presenter.
- **Dialogs as presenter state (R234):** `vm.dialog` is `{ kind, namespace, reviewId, stepId }` (ids and strings only); `openRowAction`, `openDetails`, `closeDialog`; `actionDone` closes the dialog and notifies `ReviewActivity` with `source: "own"` for the row's namespace, which the presenter's own subscription turns into the one refetch.
- **Render-ready rows (R234, QBZ-79):** labels, owner label (AI and automation owners show the step title, never a model name), "Just now / n min ago / n h ago / Yesterday / n days ago", content-type label and URL from the row binding, and row actions (`start`, `takeOver`, `reassign`, `cancel`) from Task 13's `getReviewActions` over the server `flags` only (Review Focus 12). Approve and reject are not list actions (design: "Open the content to approve or reject").
- **No reviewing team (QBZ-73, binding):** on Team pool and Team in review, with no filter applied, a viewer whose identity has no teams (`Identity.teams`, `packages/app-admin/src/domain/Identity.ts`, read through `IdentityContext`) sees "You’re not in a reviewing team" / "Steps appear here once you’re added to a team that reviews content." instead of the normal empty text. Remaining gap: the client cannot tell which teams review content, so a member of only non-reviewing teams sees the normal empty state.
- **No wrapper around the use case:** `useCases.listReviews` is called inline, with its own `try`/`catch`, in each method that needs a page (user rule: never wrap a use case call in a helper or private method; the repetition is intended). Only state helpers (`beginLoad`, `applyFirstPage`, `applyRefresh`, ...) and pure functions are shared.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewList/abstractions.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewList/feature.ts`
- Create (pure, one function per file): `packages/app-workflows/src/review/presentation/reviewList/{getDefaultReviewListSort,getReviewListEmpty,getListReviewStateLabel,getListOwnerLabel,formatLastChange,getListRowActions,isBeyondRefetchWindow,hasRowChanged,resolveRowBinding,parseReviewListTab}.ts` and the constant file `reviewListTabs.ts`
- Create (pure test builder, used by Tasks 25-28): `packages/app-workflows/src/review/testing/createReviewListItem.ts`
- Create tests: `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`, `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`
- Modify: `packages/app-workflows/src/app.test.tsx` (Task 10's composition test, extended by Task 13's "WorkflowsAdminApp review view" `describe`; one expectation per test added)
- Modify: `packages/app-workflows/src/app.tsx` (register `ReviewListPresenterFeature` inside the gate). The package barrel `src/index.tsx` is not touched (R-k).

**Interfaces:**
- Consumes (Task 8): `IReviewListUseCases`, `ReviewListPage` (`~/review/useCases/IReviewListUseCases.js`), `IReviewUseCases` (`~/review/useCases/IReviewUseCases.js`), `ReviewListRow`, `ReviewWithFlags`, `ReviewActor` (`~/review/domain/types.js`), `ReviewState`, `ReviewStateValue` (`~/review/domain/ReviewState.js`), `StepState`, `StepStateValue` (`~/review/domain/StepState.js`), `ReviewListSort` (`~/review/domain/ReviewListSort.js`), `REVIEW_LIST_PAGE_SIZE` (`~/review/domain/constants.js`), `toReviewListRow(item: ReviewWithFlags): ReviewListRow` (`~/review/domain/toReviewListRow.js`), `ListReviewsParams`, `ReviewListWhere` (`~/review/gateway/IReviewGateway.js`), `ReviewContentRef` (`~/review/content/IReviewContentAdapter.js`). Task 10: `ReviewActivity` token and its `Interface` (`~/review/activity/abstractions.js`), the real implementation `ReviewActivity` (`~/review/activity/ReviewActivity.js`, used by the tests). Task 13: `getReviewActions({ flags, stepId, canRequest })` (`~/review/presentation/targetReview/getReviewActions.js`), `getStepStateTag(state)` (`.../getStepStateTag.js`), `TargetReviewActionVm`, `TargetReviewTagVariant` (`.../abstractions.js`), the fixtures `createActor` (`~/review/testing/createActor.js`), `createStep` (`createStep.js`), `createFlags` (`createFlags.js`) and `createReview`, `createReviewWithFlags(review, flags)` (Task 8, `~/review/testing/reviewFixtures.js`). Task 15: `ReviewActionKind` (`~/review/presentation/actionDialog/ReviewActionKind.js`; includes `"reassign"` after Task 16). Existing: `IdentityContext` (`@webiny/app-admin/features/security/IdentityContext/abstractions.js`, `getIdentity().teams`).
- Produces (consumed by Tasks 26-30): `IReviewRowBinding`, `IReviewRowProvider`, `ReviewListTab`, `ReviewListInitParams`, `ReviewListRowVm`, `IReviewListViewModel`, `IReviewListPresenter`, token `ReviewListPresenter` (`"Workflows/ReviewListPresenter"`), `ReviewListPresenterFeature` (`resolve` -> `{ presenter }`), `REVIEW_LIST_TABS`, `parseReviewListTab`, `getReviewListEmpty`, `resolveRowBinding`, `formatLastChange`, and the test builder `createReviewListItem`. Additions to the contract (all additive, used by Tasks 26-28): `vm.dialog`, `removeLeavingRow`, `openRowAction`, `openDetails`, `closeDialog`, `actionDone`, `ReviewListRowVm.stepStateVariant`, `ReviewListRowVm.highlighted`.

verify before writing code (record each result in the commit body):
- The Task 8 signature of `toReviewListRow` (above) and that `ReviewListSort` and `ReviewListKind` are string-literal unions.
- The Task 10 token `ReviewActivity` (namespace `Interface`, listener `(signal: ReviewActivitySignal) => void`) and that `~/review/activity/ReviewActivity.js` exports the implementation as `ReviewActivity` (`createImplementation` result).
- The Task 8 fixture signature `createReviewWithFlags(review, flags)` (owned by Task 8's `~/review/testing/reviewFixtures.js`, not Task 13), the Task 13 `getReviewActions` order of kinds (cancel, reassign, reject, takeOver, start, approve) and that `getStepStateTag(state: StepStateValue)` returns `{ label, variant }`.
- `packages/app-workflows/vitest.config.ts` is Task 14's (jsdom, DOM setup file, svg alias) and `@webiny/di` is a devDependency of the package.

- [ ] **Step 1: Write the failing tests**

The pure test builder. `packages/app-workflows/src/review/testing/createReviewListItem.ts` (data only, no vitest, mobx or DI import, so other packages can import it, R-c):

```ts
import type { ReviewActor } from "~/review/domain/types.js";
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { createActor } from "./createActor.js";
import { createFlags } from "./createFlags.js";
import { createReview } from "./reviewFixtures.js";
import { createReviewWithFlags } from "./reviewFixtures.js";
import { createStep } from "./createStep.js";

export interface ReviewListItemOverrides {
    id?: string;
    namespace?: string;
    targetId?: string;
    targetRevisionId?: string;
    title?: string;
    modelId?: string;
    state?: ReviewStateValue;
    stepId?: string;
    stepTitle?: string;
    stepState?: StepStateValue;
    owner?: ReviewActor | null;
    requester?: ReviewActor;
    lastChangedOn?: string;
    flags?: Partial<ReviewViewerFlags>;
}

/** One review with one current step, built from the shared fixtures, as the list endpoints return it. */
export const createReviewListItem = (overrides: ReviewListItemOverrides = {}): ReviewWithFlags => {
    const id = overrides.id ?? "review-1";
    const stepId = overrides.stepId ?? "step-1";
    const state = overrides.state ?? ReviewState.InProgress;
    const stepState = overrides.stepState ?? StepState.Awaiting;
    const owner = overrides.owner ?? null;
    const title = overrides.title ?? `Title of ${id}`;
    const lastChangedOn = overrides.lastChangedOn ?? "2026-10-16T10:00:00.000Z";

    const step = createStep({
        id: stepId,
        title: overrides.stepTitle ?? "Editorial check",
        state: stepState,
        owner
    });
    const review = createReview({
        id,
        namespace: overrides.namespace ?? "cms.article",
        targetId: overrides.targetId ?? `entry-${id}`,
        targetRevisionId: overrides.targetRevisionId ?? `entry-${id}#0001`,
        title,
        isActive: state === ReviewState.InProgress,
        state,
        currentStepId: stepId,
        currentStepState: stepState,
        currentOwnerId: owner ? owner.id : null,
        targetContext: {
            folder: null,
            modelId: overrides.modelId ?? "article",
            title,
            author: { id: "user-author", displayName: "Ana Horvat" }
        },
        steps: [step],
        createdBy: overrides.requester ?? createActor({ id: "user-requester" }),
        lastChangedOn
    });

    return createReviewWithFlags(review, createFlags(overrides.flags));
};
```

`packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import type { IReviewRowBinding } from "./abstractions.js";
import { formatLastChange } from "./formatLastChange.js";
import { getDefaultReviewListSort } from "./getDefaultReviewListSort.js";
import { getListOwnerLabel } from "./getListOwnerLabel.js";
import { getListReviewStateLabel } from "./getListReviewStateLabel.js";
import { getListRowActions } from "./getListRowActions.js";
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { parseReviewListTab } from "./parseReviewListTab.js";
import { resolveRowBinding } from "./resolveRowBinding.js";
import { REVIEW_LIST_TABS } from "./reviewListTabs.js";

const row = (overrides = {}) => toReviewListRow(createReviewListItem(overrides));

describe("review list pure functions", () => {
    it("sorts the work queues oldest first and My requests newest first (QBZ-69)", () => {
        expect(getDefaultReviewListSort("assignedToMe")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("pool")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("teamInReview")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("myRequests")).toBe("lastChangedOn_DESC");
    });

    it("labels every review state", () => {
        expect(getListReviewStateLabel(ReviewState.InProgress)).toBe("In progress");
        expect(getListReviewStateLabel(ReviewState.Approved)).toBe("Approved");
        expect(getListReviewStateLabel(ReviewState.Rejected)).toBe("Rejected");
        expect(getListReviewStateLabel(ReviewState.Cancelled)).toBe("Cancelled");
    });

    it("shows the person for a user owner and the step title for AI and automation (QBZ-79)", () => {
        const user = createActor({ id: "u1", displayName: "Marko Babić" });
        const ai = createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" });
        const automation = createActor({
            id: "auto-1",
            displayName: "Send webhook",
            type: "automation"
        });

        expect(getListOwnerLabel(null, "Editorial check")).toBeNull();
        expect(getListOwnerLabel(user, "Editorial check")).toBe("Marko Babić");
        expect(getListOwnerLabel(ai, "AI review")).toBe("AI review");
        expect(getListOwnerLabel(automation, "Notify web team")).toBe("Notify web team");
        expect(getListOwnerLabel(automation, null)).toBe("Send webhook");
    });

    it("formats the last change (README 8)", () => {
        const now = new Date(2026, 9, 16, 12, 0, 0);

        expect(formatLastChange(new Date(2026, 9, 16, 11, 59, 40).toISOString(), now)).toBe(
            "Just now"
        );
        expect(formatLastChange(new Date(2026, 9, 16, 11, 48).toISOString(), now)).toBe(
            "12 min ago"
        );
        expect(formatLastChange(new Date(2026, 9, 16, 9, 0).toISOString(), now)).toBe("3 h ago");
        expect(formatLastChange(new Date(2026, 9, 15, 9, 0).toISOString(), now)).toBe("Yesterday");
        expect(formatLastChange(new Date(2026, 9, 13, 9, 0).toISOString(), now)).toBe(
            "3 days ago"
        );
        expect(formatLastChange(new Date(2026, 9, 17, 9, 0).toISOString(), now)).toBe("Just now");
        expect(formatLastChange("not a date", now)).toBe("");
    });

    it("builds the list actions from the flags only, through getReviewActions (D5, D54)", () => {
        expect(getListRowActions(row())).toEqual([]);

        const actions = getListRowActions(
            row({
                stepId: "step-9",
                flags: {
                    canStart: true,
                    canTakeOver: true,
                    canReassign: true,
                    canCancel: true,
                    canApprove: true,
                    canReject: true
                }
            })
        );

        expect(actions.map(action => action.kind).sort()).toEqual([
            "cancel",
            "reassign",
            "start",
            "takeOver"
        ]);
        expect(actions.every(action => action.stepId === "step-9")).toBe(true);
        expect(actions.find(action => action.kind === "start")?.label).toBe("Start");
        expect(actions.find(action => action.kind === "cancel")?.label).toBe("Cancel review");
    });

    it("has an empty state per tab, for filters and for a viewer in no team (README 8, QBZ-72, QBZ-73)", () => {
        expect(getReviewListEmpty("assignedToMe", false, true)).toEqual({
            title: "Nothing assigned to you",
            description: "Steps you own and are reviewing appear here."
        });
        expect(getReviewListEmpty("pool", false, true)).toEqual({
            title: "Your team pools are empty",
            description: "Steps waiting for someone in your teams to start them appear here."
        });
        expect(getReviewListEmpty("teamInReview", false, true)).toEqual({
            title: "Nobody in your teams is reviewing",
            description: "Steps that a teammate is reviewing appear here."
        });
        expect(getReviewListEmpty("myRequests", false, true)).toEqual({
            title: "You haven’t requested any reviews",
            description: "Request a review from the review bar in the content editor."
        });
        expect(getReviewListEmpty("pool", true, true)).toEqual({
            title: "No reviews match these filters",
            description: ""
        });

        const noTeam = {
            title: "You’re not in a reviewing team",
            description: "Steps appear here once you’re added to a team that reviews content."
        };
        expect(getReviewListEmpty("pool", false, false)).toEqual(noTeam);
        expect(getReviewListEmpty("teamInReview", false, false)).toEqual(noTeam);
        expect(getReviewListEmpty("assignedToMe", false, false).title).toBe(
            "Nothing assigned to you"
        );
        expect(getReviewListEmpty("myRequests", false, false).title).toBe(
            "You haven’t requested any reviews"
        );
        expect(getReviewListEmpty("pool", true, false).title).toBe("No reviews match these filters");
    });

    it("lists the four tabs in design order and parses a tab value", () => {
        expect(REVIEW_LIST_TABS.map(tab => tab.label)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests"
        ]);
        expect(parseReviewListTab("pool")).toBe("pool");
        expect(parseReviewListTab("myRequests")).toBe("myRequests");
        expect(parseReviewListTab("failedSteps")).toBeNull();
        expect(parseReviewListTab(undefined)).toBeNull();
    });

    it("detects a changed row by step, state, owner, review state and last change", () => {
        const base = row({ id: "r1" });

        expect(hasRowChanged(base, row({ id: "r1" }))).toBe(false);
        expect(hasRowChanged(base, row({ id: "r1", stepId: "step-2" }))).toBe(true);
        expect(hasRowChanged(base, row({ id: "r1", stepState: StepState.InReview }))).toBe(true);
        expect(
            hasRowChanged(base, row({ id: "r1", owner: createActor({ id: "u9", displayName: "X" }) }))
        ).toBe(true);
        expect(hasRowChanged(base, row({ id: "r1", state: ReviewState.Approved }))).toBe(true);
        expect(hasRowChanged(base, row({ id: "r1", lastChangedOn: "2026-10-17T10:00:00.000Z" }))).toBe(
            true
        );
    });

    it("knows which row sorts after the last row of a refetch window", () => {
        const early = row({ id: "early", lastChangedOn: "2026-10-16T08:00:00.000Z" });
        const late = row({ id: "late", lastChangedOn: "2026-10-16T09:00:00.000Z" });

        expect(isBeyondRefetchWindow(late, early, "lastChangedOn_ASC")).toBe(true);
        expect(isBeyondRefetchWindow(early, late, "lastChangedOn_ASC")).toBe(false);
        expect(isBeyondRefetchWindow(early, late, "lastChangedOn_DESC")).toBe(true);
        expect(isBeyondRefetchWindow(late, early, "lastChangedOn_DESC")).toBe(false);
        expect(isBeyondRefetchWindow(late, null, "lastChangedOn_ASC")).toBe(true);
    });

    it("resolves a row's binding, URL and content type label, or nothing for an unbound namespace", () => {
        const binding: IReviewRowBinding = {
            useCases: {} as unknown as IReviewRowBinding["useCases"],
            getContentUrl: ref => `/c/${ref.contentTypeId}?id=${ref.targetRevisionId}`,
            getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
        };
        const provider = {
            getBinding: (namespace: string) => (namespace === "cms.article" ? binding : null)
        };

        const bound = resolveRowBinding(provider, row({ targetRevisionId: "e1#1", modelId: "article" }));
        expect(bound.binding).toBe(binding);
        expect(bound.contentUrl).toBe("/c/article?id=e1#1");
        expect(bound.contentTypeLabel).toBe("Type article");

        const unbound = resolveRowBinding(provider, row({ namespace: "other.app" }));
        expect(unbound).toEqual({ binding: null, contentUrl: null, contentTypeLabel: null });

        expect(resolveRowBinding(null, row())).toEqual({
            binding: null,
            contentUrl: null,
            contentTypeLabel: null
        });
    });
});
```

`packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewActivity as ReviewActivityImplementation } from "~/review/activity/ReviewActivity.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { ReviewListPresenter } from "./abstractions.js";
import type { IReviewRowBinding } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";
import type { ReviewListInitParams } from "./abstractions.js";
import { ReviewListPresenterFeature } from "./feature.js";

interface Deferred<T> {
    promise: Promise<T>;
    resolve(value: T): void;
}

const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const page = (
    items: ReviewWithFlags[],
    cursor: string | null = null,
    hasMoreItems = false
): ReviewListPage => {
    return { items, meta: { cursor, hasMoreItems } };
};

const cmsUseCases = { name: "cms" } as unknown as IReviewUseCases;

const cmsBinding: IReviewRowBinding = {
    useCases: cmsUseCases,
    getContentUrl: ref => `/cms/content-entries/${ref.contentTypeId}?id=${ref.targetRevisionId}`,
    getContentTypeLabel: contentTypeId => `Type ${contentTypeId}`
};

const rowProvider: IReviewRowProvider = {
    getBinding: namespace => {
        if (namespace.startsWith("cms.")) {
            return cmsBinding;
        }
        return null;
    }
};

const createIdentityContext = (teamCount: number): IdentityContext.Interface => {
    const teams = Array.from({ length: teamCount }, (_, index) => {
        return { id: `team-${index}`, slug: `team-${index}`, name: `Team ${index}` };
    });
    const identity = { teams } as unknown as Identity;
    return { getIdentity: () => identity, setIdentity: vi.fn(), clear: vi.fn() };
};

const setup = (teamCount = 1) => {
    const container = new Container();
    container.register(ReviewActivityImplementation).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount));
    ReviewListPresenterFeature.register(container);
    const activity = container.resolve(ReviewActivity);
    const presenter = container.resolve(ReviewListPresenter);
    const listReviews = vi.fn<IReviewListUseCases["listReviews"]>();
    const useCases: IReviewListUseCases = { listReviews };
    const params: ReviewListInitParams = {
        useCases,
        namespaces: ["cms.article", "cms.press"],
        rowProvider,
        initialTab: "assignedToMe"
    };
    return { presenter, activity, listReviews, params };
};

const ascendingPage = (count: number): ReviewWithFlags[] => {
    return Array.from({ length: count }, (_, index) => {
        return createReviewListItem({
            id: `a${index}`,
            lastChangedOn: new Date(Date.UTC(2026, 9, 16, 8, index)).toISOString()
        });
    });
};

describe("ReviewListPresenter", () => {
    it("loads the first page of the initial tab with its default sort", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1", title: "First" })]));

        await presenter.init(params);

        expect(listReviews).toHaveBeenCalledTimes(1);
        expect(listReviews).toHaveBeenCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.tab).toBe("assignedToMe");
        expect(presenter.vm.rows.map(row => row.title)).toEqual(["First"]);
    });

    it("renders row labels, owner, requester and the content type from the binding", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(
            page([
                createReviewListItem({
                    id: "r1",
                    stepTitle: "Legal check",
                    stepState: StepState.InReview,
                    owner: createActor({ id: "u-owner", displayName: "Marko Babić" }),
                    requester: createActor({ id: "u-req", displayName: "Maja Kos" }),
                    modelId: "article",
                    targetRevisionId: "e1#0002"
                })
            ])
        );

        await presenter.init(params);

        const row = presenter.vm.rows[0];
        expect(row.reviewStateLabel).toBe("In progress");
        expect(row.stepTitle).toBe("Legal check");
        expect(row.stepStateLabel).toBe("In review");
        expect(row.stepStateVariant).toBe("accent-light");
        expect(row.ownerLabel).toBe("Marko Babić");
        expect(row.requesterName).toBe("Maja Kos");
        expect(row.contentTypeLabel).toBe("Type article");
        expect(row.contentUrl).toBe("/cms/content-entries/article?id=e1#0002");
        expect(row.leaving).toBe(false);
        expect(row.highlighted).toBe(false);
    });

    it("gives an unbound namespace no link, no content type and no actions (R206)", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(
            page([
                createReviewListItem({
                    id: "bound",
                    namespace: "cms.article",
                    flags: { canStart: true }
                }),
                createReviewListItem({
                    id: "unbound",
                    namespace: "other.app",
                    flags: { canStart: true, canCancel: true }
                })
            ])
        );

        await presenter.init(params);

        const [bound, unbound] = presenter.vm.rows;
        expect(bound.contentUrl).not.toBeNull();
        expect(bound.actions.map(action => action.kind)).toEqual(["start"]);
        expect(unbound.contentUrl).toBeNull();
        expect(unbound.contentTypeLabel).toBeNull();
        expect(unbound.actions).toEqual([]);
    });

    it("resets sort, search and filters on a tab switch and sends the My requests filters only there", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setSearch("  budget  ");
        await presenter.setContentType("article");
        await presenter.setReviewState(ReviewState.Approved);
        await presenter.setStepState(StepState.Failed);
        expect(listReviews).toHaveBeenLastCalledWith({
            list: "assignedToMe",
            where: { titleContains: "budget", modelId: "article" },
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.isFiltered).toBe(true);

        await presenter.setTab("myRequests");
        expect(listReviews).toHaveBeenLastCalledWith({
            list: "myRequests",
            where: {},
            sort: "lastChangedOn_DESC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.search).toBe("");
        expect(presenter.vm.contentTypeId).toBeNull();
        expect(presenter.vm.reviewState).toBeNull();
        expect(presenter.vm.stepState).toBeNull();

        await presenter.setReviewState(ReviewState.Approved);
        await presenter.setStepState(StepState.Awaiting);
        expect(listReviews).toHaveBeenLastCalledWith({
            list: "myRequests",
            where: { reviewState: ReviewState.Approved, stepState: StepState.Awaiting },
            sort: "lastChangedOn_DESC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
    });

    it("does not refetch for an unchanged search and clears every filter", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setSearch("");
        expect(listReviews).toHaveBeenCalledTimes(1);

        await presenter.setSearch("a");
        await presenter.setContentType("press");
        await presenter.clearFilters();

        expect(listReviews).toHaveBeenLastCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: null
        });
        expect(presenter.vm.isFiltered).toBe(false);
    });

    it("toggles the sort direction and reloads in that order", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.toggleSort();
        expect(presenter.vm.sort).toBe("lastChangedOn_DESC");
        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ sort: "lastChangedOn_DESC", after: null })
        );

        await presenter.toggleSort();
        expect(presenter.vm.sort).toBe("lastChangedOn_ASC");
    });

    it("loads more by cursor, skips known rows and stops when the server has no more", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "r1" }), createReviewListItem({ id: "r2" })], "c1", true)
        );
        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "r2" }), createReviewListItem({ id: "r3" })], null, false)
        );
        await presenter.init(params);
        expect(presenter.vm.hasMore).toBe(true);

        await presenter.loadMore();

        expect(listReviews).toHaveBeenLastCalledWith({
            list: "assignedToMe",
            where: {},
            sort: "lastChangedOn_ASC",
            limit: REVIEW_LIST_PAGE_SIZE,
            after: "c1"
        });
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["r1", "r2", "r3"]);
        expect(presenter.vm.hasMore).toBe(false);
        expect(presenter.vm.loadingMore).toBe(false);

        await presenter.loadMore();
        expect(listReviews).toHaveBeenCalledTimes(2);
    });

    it("keeps hasMore for a short or empty page the server says is not the end (R229)", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })], "c1", true));
        listReviews.mockResolvedValueOnce(page([], "c2", true));
        await presenter.init(params);
        expect(presenter.vm.hasMore).toBe(true);

        await presenter.loadMore();

        expect(presenter.vm.rows).toHaveLength(1);
        expect(presenter.vm.hasMore).toBe(true);
        expect(presenter.vm.empty).toBeNull();
    });

    it("keeps the rows and shows the message when loading more fails", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })], "c1", true));
        listReviews.mockRejectedValueOnce(new Error("network"));
        await presenter.init(params);

        await presenter.loadMore();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows).toHaveLength(1);
        expect(presenter.vm.loadingMore).toBe(false);
        expect(presenter.vm.error).toBe("The server did not respond. Try again in a moment.");
    });

    it("fails with a message and retries through refresh", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockRejectedValueOnce(new Error("network"));
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        await presenter.init(params);
        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.error).toBe("The server did not respond. Try again in a moment.");

        await presenter.refresh();
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.error).toBeNull();
        expect(presenter.vm.rows).toHaveLength(1);
    });

    it("shows the tab empty state, the filtered empty state and none when rows exist", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);
        expect(presenter.vm.empty).toEqual({
            title: "Nothing assigned to you",
            description: "Steps you own and are reviewing appear here."
        });

        await presenter.setSearch("nothing like this");
        expect(presenter.vm.empty).toEqual({
            title: "No reviews match these filters",
            description: ""
        });

        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.clearFilters();
        expect(presenter.vm.empty).toBeNull();
    });

    it("tells a viewer in no team so on Team pool and Team in review only (QBZ-73)", async () => {
        const { presenter, listReviews, params } = setup(0);
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);
        expect(presenter.vm.empty?.title).toBe("Nothing assigned to you");

        await presenter.setTab("pool");
        expect(presenter.vm.empty).toEqual({
            title: "You’re not in a reviewing team",
            description: "Steps appear here once you’re added to a team that reviews content."
        });

        await presenter.setTab("teamInReview");
        expect(presenter.vm.empty?.title).toBe("You’re not in a reviewing team");

        await presenter.setTab("myRequests");
        expect(presenter.vm.empty?.title).toBe("You haven’t requested any reviews");

        await presenter.setTab("pool");
        await presenter.setSearch("x");
        expect(presenter.vm.empty?.title).toBe("No reviews match these filters");
    });

    it("keeps the normal empty state for a member of a team", async () => {
        const { presenter, listReviews, params } = setup(2);
        listReviews.mockResolvedValue(page([]));
        await presenter.init(params);

        await presenter.setTab("pool");

        expect(presenter.vm.empty?.title).toBe("Your team pools are empty");
    });

    it("ignores a signal for another namespace and refetches once per signal (R210)", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        activity.notify({ namespace: "wb.page", source: "remote" });
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(1);

        activity.notify({ namespace: "cms.press", source: "remote" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));

        activity.notify({ namespace: "cms.article", source: "own" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(3));
    });

    it("collapses signals that arrive during a refetch into one follow-up and never runs two at once", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const first = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(first.promise);
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));

        activity.notify({ namespace: "cms.article", source: "remote" });
        activity.notify({ namespace: "cms.article", source: "remote" });
        activity.notify({ namespace: "cms.article", source: "own" });
        expect(listReviews).toHaveBeenCalledTimes(2);

        first.resolve(page([createReviewListItem({ id: "r1" })]));
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(3));
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(3);
    });

    it("never polls", async () => {
        vi.useFakeTimers();
        try {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
            await presenter.init(params);

            await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

            expect(listReviews).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("refetches the whole loaded window, at least one page and at most the server maximum", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValue(page(ascendingPage(25), "c1", true));
        await presenter.init(params);

        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));

        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ limit: 25, after: null })
        );
    });

    it("updates rows in place, highlights them, marks vanished rows as leaving and holds new rows back", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(
            page([
                createReviewListItem({ id: "keep", stepState: StepState.Awaiting }),
                createReviewListItem({ id: "same" }),
                createReviewListItem({ id: "gone", stepState: StepState.Awaiting })
            ])
        );
        await presenter.init(params);

        listReviews.mockResolvedValueOnce(
            page([
                createReviewListItem({
                    id: "keep",
                    stepState: StepState.InReview,
                    owner: createActor({ id: "u-owner", displayName: "Marko Babić" })
                }),
                createReviewListItem({ id: "same" }),
                createReviewListItem({ id: "fresh", title: "Brand new" })
            ])
        );
        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        const rows = presenter.vm.rows;
        expect(rows.map(row => row.reviewId)).toEqual(["keep", "same", "gone"]);
        expect(rows[0].stepStateLabel).toBe("In review");
        expect(rows[0].ownerLabel).toBe("Marko Babić");
        expect(rows[0].leaving).toBe(false);
        expect(rows[0].highlighted).toBe(true);
        expect(rows[1].highlighted).toBe(false);
        expect(rows[2].leaving).toBe(true);
        expect(presenter.vm.notice).toBe("New reviews are available.");

        presenter.removeLeavingRow("gone");
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["keep", "same"]);
    });

    it("keeps a row the refetch window pushed out when the server has more (new row on a full page)", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const loaded = ascendingPage(20);
        listReviews.mockResolvedValueOnce(page(loaded, "c1", true));
        await presenter.init(params);

        const brandNew = createReviewListItem({
            id: "newest",
            lastChangedOn: new Date(Date.UTC(2026, 9, 16, 7, 0)).toISOString()
        });
        listReviews.mockResolvedValueOnce(page([brandNew, ...loaded.slice(0, 19)], "c1", true));
        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        const rows = presenter.vm.rows;
        expect(rows).toHaveLength(20);
        expect(rows.every(row => !row.leaving)).toBe(true);
        expect(rows[19].reviewId).toBe("a19");
    });

    it("still marks a row that vanished inside the refetch window as leaving when the server has more", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const loaded = ascendingPage(20);
        listReviews.mockResolvedValueOnce(page(loaded, "c1", true));
        await presenter.init(params);

        const withoutFifth = loaded.filter(item => item.review.id !== "a5");
        listReviews.mockResolvedValueOnce(page(withoutFifth, "c1", true));
        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => {
            expect(presenter.vm.rows.find(row => row.reviewId === "a5")?.leaving).toBe(true);
        });

        expect(presenter.vm.rows.filter(row => row.leaving)).toHaveLength(1);
    });

    it("marks a vanished last row as leaving when the server has no more", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const loaded = ascendingPage(3);
        listReviews.mockResolvedValueOnce(page(loaded, null, false));
        await presenter.init(params);

        listReviews.mockResolvedValueOnce(page(loaded.slice(0, 2), null, false));
        activity.notify({ namespace: "cms.article", source: "remote" });

        await vi.waitFor(() => {
            expect(presenter.vm.rows.find(row => row.reviewId === "a2")?.leaving).toBe(true);
        });
    });

    it("shows new reviews by reloading the first page, highlighted, and clears the notice", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "old" })]));
        await presenter.init(params);
        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "old" }), createReviewListItem({ id: "fresh" })])
        );
        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(presenter.vm.notice).not.toBeNull());

        listReviews.mockResolvedValueOnce(
            page([createReviewListItem({ id: "fresh" }), createReviewListItem({ id: "old" })])
        );
        await presenter.showNewReviews();

        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ limit: REVIEW_LIST_PAGE_SIZE, after: null })
        );
        expect(presenter.vm.notice).toBeNull();
        expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["fresh", "old"]);
        expect(presenter.vm.rows.map(row => row.highlighted)).toEqual([true, false]);
    });

    it("keeps the visible rows when a background refetch fails", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);
        listReviews.mockRejectedValueOnce(new Error("network"));

        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
        await Promise.resolve();

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows).toHaveLength(1);
        expect(presenter.vm.error).toBeNull();
    });

    it("opens a row dialog, closes it and turns a finished action into one own signal and one refetch", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const notify = vi.spyOn(activity, "notify");
        listReviews.mockResolvedValue(
            page([createReviewListItem({ id: "r1", stepId: "step-7", flags: { canStart: true } })])
        );
        await presenter.init(params);

        presenter.openRowAction("r1", "start", "step-7");
        expect(presenter.vm.dialog).toEqual({
            kind: "start",
            namespace: "cms.article",
            reviewId: "r1",
            stepId: "step-7"
        });

        presenter.closeDialog();
        expect(presenter.vm.dialog).toBeNull();

        presenter.openDetails("r1");
        expect(presenter.vm.dialog).toEqual({
            kind: "details",
            namespace: "cms.article",
            reviewId: "r1",
            stepId: null
        });

        presenter.openRowAction("r1", "takeOver", "step-7");
        presenter.actionDone();

        expect(presenter.vm.dialog).toBeNull();
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({ namespace: "cms.article", source: "own" });
        await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
    });

    it("ignores an unknown row and the request kind when opening a dialog", async () => {
        const { presenter, listReviews, params } = setup();
        listReviews.mockResolvedValue(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        presenter.openRowAction("missing", "start", null);
        presenter.openRowAction("r1", "request", null);
        presenter.openDetails("missing");

        expect(presenter.vm.dialog).toBeNull();
    });

    it("unsubscribes on dispose and ignores a response that arrives afterwards", async () => {
        const { presenter, activity, listReviews, params } = setup();
        const pending = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(pending.promise);

        const initializing = presenter.init(params);
        presenter.dispose();
        pending.resolve(page([createReviewListItem({ id: "late" })]));
        await initializing;

        expect(presenter.vm.rows).toEqual([]);

        activity.notify({ namespace: "cms.article", source: "remote" });
        await Promise.resolve();
        expect(listReviews).toHaveBeenCalledTimes(1);
    });

    it("keeps refreshing after a reload that superseded an in-flight refetch", async () => {
        const { presenter, activity, listReviews, params } = setup();
        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r1" })]));
        await presenter.init(params);

        const stale = createDeferred<ReviewListPage>();
        listReviews.mockReturnValueOnce(stale.promise);
        activity.notify({ namespace: "cms.article", source: "remote" });
        expect(listReviews).toHaveBeenCalledTimes(2);

        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r2" })]));
        await presenter.setTab("pool");
        stale.resolve(page([createReviewListItem({ id: "stale" })]));
        await Promise.resolve();

        listReviews.mockResolvedValueOnce(page([createReviewListItem({ id: "r3" })]));
        activity.notify({ namespace: "cms.article", source: "remote" });
        await vi.waitFor(() => expect(presenter.vm.rows.map(row => row.reviewId)).toEqual(["r3"]));
    });

    it("keeps two presenters independent", async () => {
        const first = setup();
        const second = setup();
        first.listReviews.mockResolvedValue(page([createReviewListItem({ id: "a" })]));
        second.listReviews.mockResolvedValue(page([createReviewListItem({ id: "b" })]));

        await first.presenter.init(first.params);
        await second.presenter.init(second.params);
        await second.presenter.setTab("pool");

        expect(first.presenter.vm.tab).toBe("assignedToMe");
        expect(second.presenter.vm.tab).toBe("pool");
        expect(first.presenter.vm.rows.map(row => row.reviewId)).toEqual(["a"]);
        expect(second.presenter.vm.rows.map(row => row.reviewId)).toEqual(["b"]);
    });
});
```

Composition root (Review Focus 8). Task 13 added the container-style `describe("WorkflowsAdminApp review view")` to Task 10's `src/app.test.tsx` (it mounts `WorkflowsAdminApp` with the flag on and off and resolves tokens from the container; Tasks 15 to 18 each added their token to its three tests). This task adds its token the same way: import the token and add one line to each of the three tests.

```tsx
import { ReviewListPresenter } from "~/review/presentation/reviewList/abstractions.js";

// in "registers the review view presenters when the flag is on":
expect(container.resolve(ReviewListPresenter)).toBeDefined();

// in "registers the presenters transient: every resolve is a new instance (R212)":
expect(container.resolve(ReviewListPresenter)).not.toBe(container.resolve(ReviewListPresenter));

// in "registers no review view presenter when the flag is off (R211)":
expect(() => container.resolve(ReviewListPresenter)).toThrow();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: the first two FAIL with `Failed to resolve import "./formatLastChange.js"`, `"./abstractions.js"` or `"./feature.js"` (the modules do not exist yet); `app.test.tsx` FAILS to load (`Failed to resolve import "~/review/presentation/reviewList/abstractions.js"`). `createReviewListItem.ts` already exists and compiles once Tasks 8, 10 and 13 are in.

- [ ] **Step 3: Implement**

`packages/app-workflows/src/review/presentation/reviewList/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { ReviewActionKind } from "~/review/presentation/actionDialog/ReviewActionKind.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";

/**
 * What the list needs to know about one app for the rows of its namespace: the app's use cases
 * (row actions and the details drawer run on them), the content URL and the content type label.
 */
export interface IReviewRowBinding {
    readonly useCases: IReviewUseCases;
    getContentUrl(ref: ReviewContentRef): string;
    getContentTypeLabel(contentTypeId: string): string | null;
}

/**
 * Resolves the binding of a row's namespace. A namespace nobody binds returns `null` and its rows
 * render without a link and without actions (R206). A future global list passes a provider over
 * several apps.
 */
export interface IReviewRowProvider {
    getBinding(namespace: string): IReviewRowBinding | null;
}

export type ReviewListTab = "assignedToMe" | "pool" | "teamInReview" | "myRequests";

export type ReviewListStatus = "loading" | "ready" | "failed";

export type ReviewListDialogKind = "details" | ReviewActionKind;

export interface ReviewListInitParams {
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    initialTab: ReviewListTab;
}

export interface ReviewListRowVm {
    reviewId: string;
    namespace: string;
    title: string;
    reviewStateLabel: string;
    stepTitle: string | null;
    stepStateLabel: string | null;
    stepStateVariant: TargetReviewTagVariant;
    ownerLabel: string | null;
    requesterName: string;
    lastChange: string;
    contentTypeLabel: string | null;
    contentUrl: string | null;
    leaving: boolean;
    highlighted: boolean;
    actions: TargetReviewActionVm[];
}

export interface ReviewListEmptyVm {
    title: string;
    description: string;
}

export interface ReviewListDialogVm {
    kind: ReviewListDialogKind;
    namespace: string;
    reviewId: string;
    stepId: string | null;
}

export interface IReviewListViewModel {
    tab: ReviewListTab;
    rows: ReviewListRowVm[];
    status: ReviewListStatus;
    loadingMore: boolean;
    hasMore: boolean;
    sort: ReviewListSort;
    search: string;
    contentTypeId: string | null;
    reviewState: ReviewStateValue | null;
    stepState: StepStateValue | null;
    notice: string | null;
    error: string | null;
    empty: ReviewListEmptyVm | null;
    isFiltered: boolean;
    dialog: ReviewListDialogVm | null;
}

export interface IReviewListPresenter {
    readonly vm: IReviewListViewModel;
    init(params: ReviewListInitParams): Promise<void>;
    setTab(tab: ReviewListTab): Promise<void>;
    setSearch(search: string): Promise<void>;
    setContentType(contentTypeId: string | null): Promise<void>;
    setReviewState(reviewState: ReviewStateValue | null): Promise<void>;
    setStepState(stepState: StepStateValue | null): Promise<void>;
    toggleSort(): Promise<void>;
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
    showNewReviews(): Promise<void>;
    clearFilters(): Promise<void>;
    removeLeavingRow(reviewId: string): void;
    openRowAction(reviewId: string, kind: TargetReviewActionVm["kind"], stepId: string | null): void;
    openDetails(reviewId: string): void;
    closeDialog(): void;
    actionDone(): void;
    dispose(): void;
}

export const ReviewListPresenter = createAbstraction<IReviewListPresenter>(
    "Workflows/ReviewListPresenter"
);

export namespace ReviewListPresenter {
    export type Interface = IReviewListPresenter;
    export type ViewModel = IReviewListViewModel;
}
```

`packages/app-workflows/src/review/presentation/reviewList/reviewListTabs.ts`:

```ts
import type { ReviewListTab } from "./abstractions.js";

export interface ReviewListTabDefinition {
    value: ReviewListTab;
    label: string;
}

/** The four tabs in design order (README 8); the Failed steps tab belongs to 8b. */
export const REVIEW_LIST_TABS: ReviewListTabDefinition[] = [
    { value: "assignedToMe", label: "Assigned to me" },
    { value: "pool", label: "Team pool" },
    { value: "teamInReview", label: "Team in review" },
    { value: "myRequests", label: "My requests" }
];
```

`packages/app-workflows/src/review/presentation/reviewList/parseReviewListTab.ts`:

```ts
import type { ReviewListTab } from "./abstractions.js";
import { REVIEW_LIST_TABS } from "./reviewListTabs.js";

/** Narrows a string (a route parameter, a tab trigger value) to a list tab, or `null`. */
export const parseReviewListTab = (value: string | null | undefined): ReviewListTab | null => {
    const tab = REVIEW_LIST_TABS.find(item => item.value === value);
    if (!tab) {
        return null;
    }
    return tab.value;
};
```

`packages/app-workflows/src/review/presentation/reviewList/getDefaultReviewListSort.ts`:

```ts
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListTab } from "./abstractions.js";

/** Work queues list the longest-waiting item first, My requests the newest change first (QBZ-69). */
export const getDefaultReviewListSort = (tab: ReviewListTab): ReviewListSort => {
    if (tab === "myRequests") {
        return "lastChangedOn_DESC";
    }
    return "lastChangedOn_ASC";
};
```

`packages/app-workflows/src/review/presentation/reviewList/getReviewListEmpty.ts`:

```ts
import type { ReviewListEmptyVm } from "./abstractions.js";
import type { ReviewListTab } from "./abstractions.js";

const TAB_EMPTY: Record<ReviewListTab, ReviewListEmptyVm> = {
    assignedToMe: {
        title: "Nothing assigned to you",
        description: "Steps you own and are reviewing appear here."
    },
    pool: {
        title: "Your team pools are empty",
        description: "Steps waiting for someone in your teams to start them appear here."
    },
    teamInReview: {
        title: "Nobody in your teams is reviewing",
        description: "Steps that a teammate is reviewing appear here."
    },
    myRequests: {
        title: "You haven’t requested any reviews",
        description: "Request a review from the review bar in the content editor."
    }
};

const FILTERED_EMPTY: ReviewListEmptyVm = {
    title: "No reviews match these filters",
    description: ""
};

const NO_TEAM_EMPTY: ReviewListEmptyVm = {
    title: "You’re not in a reviewing team",
    description: "Steps appear here once you’re added to a team that reviews content."
};

/**
 * Empty-state copy of README 8, QBZ-72 and QBZ-73. The filtered state has a title only. A viewer
 * with no teams gets the no-team text on the two team tabs; the client cannot tell which teams
 * review content, so a member of only non-reviewing teams still sees the normal text.
 */
export const getReviewListEmpty = (
    tab: ReviewListTab,
    isFiltered: boolean,
    hasTeams: boolean
): ReviewListEmptyVm => {
    if (isFiltered) {
        return FILTERED_EMPTY;
    }
    if (!hasTeams && (tab === "pool" || tab === "teamInReview")) {
        return NO_TEAM_EMPTY;
    }
    return TAB_EMPTY[tab];
};
```

`packages/app-workflows/src/review/presentation/reviewList/getListReviewStateLabel.ts`:

```ts
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";

const LABELS: Record<ReviewStateValue, string> = {
    [ReviewState.InProgress]: "In progress",
    [ReviewState.Approved]: "Approved",
    [ReviewState.Rejected]: "Rejected",
    [ReviewState.Cancelled]: "Cancelled"
};

export const getListReviewStateLabel = (state: ReviewStateValue): string => {
    return LABELS[state];
};
```

`packages/app-workflows/src/review/presentation/reviewList/getListOwnerLabel.ts`:

```ts
import type { ReviewActor } from "~/review/domain/types.js";

/**
 * A person is named; an AI or automation owner shows the step title, never the model or
 * automation behind it (QBZ-79).
 */
export const getListOwnerLabel = (
    owner: ReviewActor | null,
    stepTitle: string | null
): string | null => {
    if (!owner) {
        return null;
    }
    if (owner.type === "user") {
        return owner.displayName;
    }
    return stepTitle ?? owner.displayName;
};
```

`packages/app-workflows/src/review/presentation/reviewList/formatLastChange.ts`:

```ts
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const startOfDay = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/**
 * "Just now", "12 min ago", "3 h ago", "Yesterday", "n days ago" (README 8). A date in the future
 * (clock skew) reads "Just now"; an unparsable date reads as an empty string.
 */
export const formatLastChange = (isoDate: string, now: Date): string => {
    const changed = new Date(isoDate);
    const elapsed = now.getTime() - changed.getTime();

    if (Number.isNaN(elapsed)) {
        return "";
    }
    if (elapsed < MINUTE) {
        return "Just now";
    }
    if (elapsed < HOUR) {
        return `${Math.floor(elapsed / MINUTE)} min ago`;
    }
    if (elapsed < DAY) {
        return `${Math.floor(elapsed / HOUR)} h ago`;
    }

    const days = Math.round((startOfDay(now) - startOfDay(changed)) / DAY);
    if (days <= 1) {
        return "Yesterday";
    }
    return `${days} days ago`;
};
```

`packages/app-workflows/src/review/presentation/reviewList/getListRowActions.ts`:

```ts
import type { ReviewListRow } from "~/review/domain/types.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import { getReviewActions } from "~/review/presentation/targetReview/getReviewActions.js";

/**
 * The actions a list row offers: Task 13's `getReviewActions` over the server flags (D5, D54),
 * limited to start, take over, reassign and cancel. Approve and reject are not list actions
 * (design: "Open the content to approve or reject"); request never applies to an existing review.
 */
export const getListRowActions = (row: ReviewListRow): TargetReviewActionVm[] => {
    const actions = getReviewActions({ flags: row.flags, stepId: row.stepId, canRequest: false });

    return actions.filter(action => {
        return (
            action.kind === "start" ||
            action.kind === "takeOver" ||
            action.kind === "reassign" ||
            action.kind === "cancel"
        );
    });
};
```

`packages/app-workflows/src/review/presentation/reviewList/isBeyondRefetchWindow.ts`:

```ts
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListRow } from "~/review/domain/types.js";

/**
 * Whether a row sorts after the last row a refetch returned. When the server says it has more,
 * such a row is not gone, the window just did not reach it. Equal timestamps count as beyond (the
 * row stays rather than fading by mistake). Without a last row (an empty page that still has more)
 * nothing can be told, so the row is kept.
 */
export const isBeyondRefetchWindow = (
    row: ReviewListRow,
    lastReturned: ReviewListRow | null,
    sort: ReviewListSort
): boolean => {
    if (!lastReturned) {
        return true;
    }

    const rowTime = new Date(row.lastChangedOn).getTime();
    const lastTime = new Date(lastReturned.lastChangedOn).getTime();
    if (sort === "lastChangedOn_ASC") {
        return rowTime >= lastTime;
    }
    return rowTime <= lastTime;
};
```

`packages/app-workflows/src/review/presentation/reviewList/hasRowChanged.ts`:

```ts
import type { ReviewListRow } from "~/review/domain/types.js";

/** What the table shows of a review changed between two reads (QBZ-86: the row is highlighted). */
export const hasRowChanged = (previous: ReviewListRow, next: ReviewListRow): boolean => {
    const previousOwner = previous.owner ? previous.owner.id : null;
    const nextOwner = next.owner ? next.owner.id : null;

    return (
        previous.stepId !== next.stepId ||
        previous.stepState !== next.stepState ||
        previous.reviewState !== next.reviewState ||
        previousOwner !== nextOwner ||
        previous.lastChangedOn !== next.lastChangedOn
    );
};
```

`packages/app-workflows/src/review/presentation/reviewList/resolveRowBinding.ts`:

```ts
import type { ReviewContentRef } from "~/review/content/IReviewContentAdapter.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import type { IReviewRowBinding } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";

export interface ResolvedRowBinding {
    binding: IReviewRowBinding | null;
    contentUrl: string | null;
    contentTypeLabel: string | null;
}

/**
 * The app binding of a row and what it gives the row: the content URL and the content type label.
 * An unbound namespace (or no provider) gives nothing, so its row has no link and no actions (R206).
 * Shared by the list and the widget presenters.
 */
export const resolveRowBinding = (
    provider: IReviewRowProvider | null,
    row: ReviewListRow
): ResolvedRowBinding => {
    const binding = provider ? provider.getBinding(row.namespace) : null;
    if (!binding) {
        return { binding: null, contentUrl: null, contentTypeLabel: null };
    }

    const ref: ReviewContentRef = {
        namespace: row.namespace,
        targetId: row.targetId,
        targetRevisionId: row.targetRevisionId,
        contentTypeId: row.contentTypeId
    };

    let contentTypeLabel: string | null = null;
    if (row.contentTypeId) {
        contentTypeLabel = binding.getContentTypeLabel(row.contentTypeId);
    }

    return { binding, contentUrl: binding.getContentUrl(ref), contentTypeLabel };
};
```

`packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
import type { ReviewListRow } from "~/review/domain/types.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { ListReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewListWhere } from "~/review/gateway/IReviewGateway.js";
import { getStepStateTag } from "~/review/presentation/targetReview/getStepStateTag.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "~/review/presentation/targetReview/abstractions.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { ReviewListPage } from "~/review/useCases/IReviewListUseCases.js";
import { ReviewListPresenter as Abstraction } from "./abstractions.js";
import type { IReviewRowProvider } from "./abstractions.js";
import type { ReviewListDialogVm } from "./abstractions.js";
import type { ReviewListEmptyVm } from "./abstractions.js";
import type { ReviewListInitParams } from "./abstractions.js";
import type { ReviewListRowVm } from "./abstractions.js";
import type { ReviewListStatus } from "./abstractions.js";
import type { ReviewListTab } from "./abstractions.js";
import { formatLastChange } from "./formatLastChange.js";
import { getDefaultReviewListSort } from "./getDefaultReviewListSort.js";
import { getListOwnerLabel } from "./getListOwnerLabel.js";
import { getListReviewStateLabel } from "./getListReviewStateLabel.js";
import { getListRowActions } from "./getListRowActions.js";
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { resolveRowBinding } from "./resolveRowBinding.js";

const NEW_REVIEWS_NOTICE = "New reviews are available.";
const LOAD_FAILED_MESSAGE = "The server did not respond. Try again in a moment.";

/** The server caps a list page at 100 rows (`MAX_REVIEW_LIST_LIMIT`). */
const MAX_REFRESH_LIMIT = 100;

const NEUTRAL_VARIANT: TargetReviewTagVariant = "neutral-base-outline";

interface ReviewListEntry {
    row: ReviewListRow;
    leaving: boolean;
    highlighted: boolean;
}

class ReviewListPresenterImpl implements Abstraction.Interface {
    private _tab: ReviewListTab = "assignedToMe";
    private _sort: ReviewListSort = "lastChangedOn_ASC";
    private _search = "";
    private _contentTypeId: string | null = null;
    private _reviewState: ReviewStateValue | null = null;
    private _stepState: StepStateValue | null = null;
    private _status: ReviewListStatus = "loading";
    private _loadingMore = false;
    private _hasMore = false;
    private _cursor: string | null = null;
    private _entries: ReviewListEntry[] = [];
    private _heldIds: string[] = [];
    private _error: string | null = null;
    private _dialog: ReviewListDialogVm | null = null;
    private useCases: IReviewListUseCases | null = null;
    private rowProvider: IReviewRowProvider | null = null;
    private unsubscribe: (() => void) | null = null;
    // A generation: every load, reload and dispose starts a new one, and a response of an older
    // generation is ignored. An in-flight refetch only counts for the generation it started in.
    private loadToken = 0;
    private refreshingToken: number | null = null;
    private refreshQueued = false;

    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewListPresenterImpl,
            | "activity"
            | "identityContext"
            | "useCases"
            | "rowProvider"
            | "unsubscribe"
            | "loadToken"
            | "refreshingToken"
            | "refreshQueued"
        >(this, {
            activity: false,
            identityContext: false,
            useCases: false,
            rowProvider: false,
            unsubscribe: false,
            loadToken: false,
            refreshingToken: false,
            refreshQueued: false
        });
    }

    // The relative times are computed when the view model is read; they are as fresh as the last
    // state change (a refetch, a tab switch), which is enough for "12 min ago" granularity.
    get vm(): Abstraction.ViewModel {
        const now = new Date();
        const rows = this._entries.map(entry => this.toRowVm(entry, now));
        const visibleCount = this._entries.filter(entry => !entry.leaving).length;
        const isFiltered =
            this._search.trim() !== "" ||
            this._contentTypeId !== null ||
            this._reviewState !== null ||
            this._stepState !== null;
        const hasTeams = this.identityContext.getIdentity().teams.length > 0;

        let empty: ReviewListEmptyVm | null = null;
        if (this._status === "ready" && visibleCount === 0 && this._heldIds.length === 0) {
            empty = getReviewListEmpty(this._tab, isFiltered, hasTeams);
        }

        let notice: string | null = null;
        if (this._heldIds.length > 0) {
            notice = NEW_REVIEWS_NOTICE;
        }

        return {
            tab: this._tab,
            rows,
            status: this._status,
            loadingMore: this._loadingMore,
            hasMore: this._hasMore,
            sort: this._sort,
            search: this._search,
            contentTypeId: this._contentTypeId,
            reviewState: this._reviewState,
            stepState: this._stepState,
            notice,
            error: this._error,
            empty,
            isFiltered,
            dialog: this._dialog
        };
    }

    async init(params: ReviewListInitParams): Promise<void> {
        this.dispose();
        this.useCases = params.useCases;
        this.rowProvider = params.rowProvider;
        this._tab = params.initialTab;
        this._sort = getDefaultReviewListSort(params.initialTab);
        this.unsubscribe = this.activity.subscribe(params.namespaces, () => {
            void this.refresh();
        });

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await params.useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setTab(tab: ReviewListTab): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._tab = tab;
        this._sort = getDefaultReviewListSort(tab);
        this._search = "";
        this._contentTypeId = null;
        this._reviewState = null;
        this._stepState = null;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setSearch(search: string): Promise<void> {
        const useCases = this.useCases;
        if (!useCases || search === this._search) {
            return;
        }

        this._search = search;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setContentType(contentTypeId: string | null): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._contentTypeId = contentTypeId;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setReviewState(reviewState: ReviewStateValue | null): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._reviewState = reviewState;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async setStepState(stepState: StepStateValue | null): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._stepState = stepState;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async toggleSort(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        if (this._sort === "lastChangedOn_ASC") {
            this._sort = "lastChangedOn_DESC";
        } else {
            this._sort = "lastChangedOn_ASC";
        }

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async clearFilters(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._search = "";
        this._contentTypeId = null;
        this._reviewState = null;
        this._stepState = null;

        const token = this.beginLoad(false);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, false);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async showNewReviews(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        const token = this.beginLoad(true);
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyFirstPage(listed, true);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyLoadFailure();
            }
        }
    }

    async loadMore(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases || !this._hasMore || this._loadingMore || this._status !== "ready") {
            return;
        }

        const token = this.loadToken;
        const request = this.createParams(REVIEW_LIST_PAGE_SIZE, this._cursor);
        this._loadingMore = true;

        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyMorePage(listed);
            }
        } catch {
            if (token === this.loadToken) {
                this.applyMoreFailure();
            }
        }
    }

    async refresh(): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        // "Try again" on a failed list: a full reload with the skeleton.
        if (this._status === "failed") {
            const reloadToken = this.beginLoad(false);
            const reloadRequest = this.createParams(REVIEW_LIST_PAGE_SIZE, null);
            try {
                const listed = await useCases.listReviews(reloadRequest);
                if (reloadToken === this.loadToken) {
                    this.applyFirstPage(listed, false);
                }
            } catch {
                if (reloadToken === this.loadToken) {
                    this.applyLoadFailure();
                }
            }
            return;
        }

        if (this._status !== "ready") {
            return;
        }
        if (this.refreshingToken === this.loadToken) {
            this.refreshQueued = true;
            return;
        }

        const token = this.loadToken;
        this.refreshingToken = token;
        const request = this.createParams(this.getRefreshLimit(), null);

        try {
            const listed = await useCases.listReviews(request);
            if (token === this.loadToken) {
                this.applyRefresh(listed);
            }
        } catch {
            // A failed background refetch keeps the visible rows; the next signal or "Show" tries again.
        }

        // A newer generation (reload, tab switch, dispose) owns the flags now.
        if (token !== this.loadToken) {
            return;
        }
        this.refreshingToken = null;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
        }
    }

    removeLeavingRow(reviewId: string): void {
        this._entries = this._entries.filter(entry => {
            return !(entry.leaving && entry.row.reviewId === reviewId);
        });
    }

    openRowAction(
        reviewId: string,
        kind: TargetReviewActionVm["kind"],
        stepId: string | null
    ): void {
        if (kind === "request") {
            return;
        }
        const entry = this._entries.find(item => item.row.reviewId === reviewId);
        if (!entry) {
            return;
        }
        this._dialog = { kind, namespace: entry.row.namespace, reviewId, stepId };
    }

    openDetails(reviewId: string): void {
        const entry = this._entries.find(item => item.row.reviewId === reviewId);
        if (!entry) {
            return;
        }
        this._dialog = {
            kind: "details",
            namespace: entry.row.namespace,
            reviewId,
            stepId: null
        };
    }

    closeDialog(): void {
        this._dialog = null;
    }

    actionDone(): void {
        const dialog = this._dialog;
        this._dialog = null;
        if (!dialog) {
            return;
        }
        this.activity.notify({ namespace: dialog.namespace, source: "own" });
    }

    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.loadToken += 1;
        this.refreshingToken = null;
        this.refreshQueued = false;
        this.useCases = null;
        this.rowProvider = null;
        this._tab = "assignedToMe";
        this._sort = "lastChangedOn_ASC";
        this._search = "";
        this._contentTypeId = null;
        this._reviewState = null;
        this._stepState = null;
        this._status = "loading";
        this._loadingMore = false;
        this._hasMore = false;
        this._cursor = null;
        this._entries = [];
        this._heldIds = [];
        this._error = null;
        this._dialog = null;
    }

    // Starts a new generation and resets what a first-page load replaces. `keepRows` keeps the
    // rows on screen (used by "Show").
    private beginLoad(keepRows: boolean): number {
        this.loadToken += 1;
        this.refreshQueued = false;
        this._error = null;
        this._loadingMore = false;
        if (!keepRows) {
            this._status = "loading";
            this._entries = [];
            this._heldIds = [];
            this._hasMore = false;
            this._cursor = null;
        }
        return this.loadToken;
    }

    private applyFirstPage(listed: ReviewListPage, highlightNew: boolean): void {
        const known = new Set(this._entries.map(entry => entry.row.reviewId));
        this._entries = listed.items.map(item => {
            const row = toReviewListRow(item);
            return { row, leaving: false, highlighted: highlightNew && !known.has(row.reviewId) };
        });
        this._heldIds = [];
        this._cursor = listed.meta.cursor;
        this._hasMore = listed.meta.hasMoreItems;
        this._error = null;
        this._status = "ready";
    }

    private applyLoadFailure(): void {
        this._entries = [];
        this._heldIds = [];
        this._hasMore = false;
        this._error = LOAD_FAILED_MESSAGE;
        this._status = "failed";
    }

    private applyMorePage(listed: ReviewListPage): void {
        const known = new Set(this._entries.map(entry => entry.row.reviewId));
        const added: ReviewListEntry[] = [];
        listed.items.forEach(item => {
            const row = toReviewListRow(item);
            if (known.has(row.reviewId)) {
                return;
            }
            known.add(row.reviewId);
            added.push({ row, leaving: false, highlighted: false });
        });
        this._entries = [...this._entries, ...added];
        this._cursor = listed.meta.cursor;
        this._hasMore = listed.meta.hasMoreItems;
        this._loadingMore = false;
        this._error = null;
    }

    private applyMoreFailure(): void {
        this._loadingMore = false;
        this._error = LOAD_FAILED_MESSAGE;
    }

    private applyRefresh(listed: ReviewListPage): void {
        const incoming = listed.items.map(item => toReviewListRow(item));
        const lastReturned = incoming.length > 0 ? incoming[incoming.length - 1] : null;
        const incomingById = new Map<string, ReviewListRow>();
        incoming.forEach(row => {
            incomingById.set(row.reviewId, row);
        });

        const known = new Set<string>();
        const entries: ReviewListEntry[] = [];
        this._entries.forEach(entry => {
            known.add(entry.row.reviewId);
            const updated = incomingById.get(entry.row.reviewId);
            if (updated) {
                const highlighted = hasRowChanged(entry.row, updated);
                entries.push({ row: updated, leaving: false, highlighted });
                return;
            }

            // The refetch window may not reach a row that sorts after its last row: keep it.
            const outsideWindow =
                listed.meta.hasMoreItems && isBeyondRefetchWindow(entry.row, lastReturned, this._sort);
            if (outsideWindow) {
                entries.push({ row: entry.row, leaving: entry.leaving, highlighted: false });
                return;
            }
            entries.push({ row: entry.row, leaving: true, highlighted: false });
        });

        this._entries = entries;
        this._heldIds = incoming.filter(row => !known.has(row.reviewId)).map(row => row.reviewId);
        this._cursor = listed.meta.cursor;
        this._hasMore = listed.meta.hasMoreItems;
        this._error = null;
    }

    private getRefreshLimit(): number {
        const loaded = this._entries.filter(entry => !entry.leaving).length;
        return Math.min(Math.max(loaded, REVIEW_LIST_PAGE_SIZE), MAX_REFRESH_LIMIT);
    }

    private createParams(limit: number, after: string | null): ListReviewsParams {
        const where: ReviewListWhere = {};
        const search = this._search.trim();
        if (search) {
            where.titleContains = search;
        }
        if (this._contentTypeId) {
            where.modelId = this._contentTypeId;
        }
        if (this._tab === "myRequests") {
            if (this._reviewState) {
                where.reviewState = this._reviewState;
            }
            if (this._stepState) {
                where.stepState = this._stepState;
            }
        }
        return { list: this._tab, where, sort: this._sort, limit, after };
    }

    private toRowVm(entry: ReviewListEntry, now: Date): ReviewListRowVm {
        const row = entry.row;
        const resolved = resolveRowBinding(this.rowProvider, row);

        let actions: TargetReviewActionVm[] = [];
        if (resolved.binding) {
            actions = getListRowActions(row);
        }

        let stepStateLabel: string | null = null;
        let stepStateVariant: TargetReviewTagVariant = NEUTRAL_VARIANT;
        if (row.stepState) {
            const tag = getStepStateTag(row.stepState);
            stepStateLabel = tag.label;
            stepStateVariant = tag.variant;
        }

        return {
            reviewId: row.reviewId,
            namespace: row.namespace,
            title: row.title,
            reviewStateLabel: getListReviewStateLabel(row.reviewState),
            stepTitle: row.stepTitle,
            stepStateLabel,
            stepStateVariant,
            ownerLabel: getListOwnerLabel(row.owner, row.stepTitle),
            requesterName: row.requester.displayName,
            lastChange: formatLastChange(row.lastChangedOn, now),
            contentTypeLabel: resolved.contentTypeLabel,
            contentUrl: resolved.contentUrl,
            leaving: entry.leaving,
            highlighted: entry.highlighted,
            actions
        };
    }
}

export const ReviewListPresenter = Abstraction.createImplementation({
    implementation: ReviewListPresenterImpl,
    dependencies: [ReviewActivity, IdentityContext]
});
```

`packages/app-workflows/src/review/presentation/reviewList/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ReviewListPresenter as Abstraction } from "./abstractions.js";
import { ReviewListPresenter } from "./ReviewListPresenter.js";

/** Transient (R212, D71): every `useFeature` resolve is a new presenter, so views never share state. */
export const ReviewListPresenterFeature = createFeature({
    name: "Workflows/ReviewListPresenter",
    register(container) {
        container.register(ReviewListPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

`packages/app-workflows/src/app.tsx`: register the feature inside the gate. Re-read the file as Tasks 10 to 19 left it, then

```diff
+import { ReviewListPresenterFeature } from "~/review/presentation/reviewList/feature.js";
```

next to the other `~/review/presentation/*/feature.js` imports, and

```diff
+            <RegisterFeature feature={ReviewListPresenterFeature} />
```

next to the other review `RegisterFeature` elements, inside the fragment that follows `if (!featureFlags.isEnabled("advancedPublishingWorkflow")) { return null; }`.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected: PASS. Admin packages run `yarn test <path>` only: they have no OpenSearch or DynamoDB storage, so `yarn test:os` does not apply.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/activity/ReviewActivity.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/domain/toReviewListRow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/presentation/targetReview/getReviewActions.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS and the build (the type check of the co-located tests, R-e) prints no errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-workflows): add the review list presenter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

**Contract notes:**
- Task 13's `getReviewActions({ flags, stepId, canRequest })` and `getStepStateTag(state)` are used instead of local label tables (`getListRowActions` filters to start, take over, reassign and cancel; the row's step tag comes from `getStepStateTag`, so the tag variant type is Task 13's `TargetReviewTagVariant`). The list keeps `getListReviewStateLabel` ("In progress", not the bar's "Review: In progress") and `getListOwnerLabel` (a row has the owner and the step title, not a step) because Task 13 has no equivalent.
- Remaining gap (R247): a member of only non-reviewing teams sees the normal empty state, because the client has no list of reviewing teams.
- R210: signals that arrive during a refetch collapse into exactly one follow-up refetch (never a parallel request, at most two requests for any burst). The in-flight flag is a generation token: a reload, tab switch or dispose supersedes it without a stale `refreshing = false`.
- The refetch window is `max(loaded rows, page size)` capped at the server maximum 100. A row that is missing from a window the server says has more behind it, and sorts after the last returned row, is kept (not faded); with equal timestamps the row is also kept. Beyond 100 loaded rows a row can therefore stay until the next Load more or Show; this is accepted.
- Highlights (QBZ-86) last until the next merge, a tab or filter change, or Show; the design's "one row just updated, highlighted" has no timer here because the presenter never uses timers.
- `useCases.listReviews` is called inline in twelve methods (R248); only state helpers are shared, so a change to the fetch-and-apply shape is made in each.
- The composition-root expectations go into Task 10's `src/app.test.tsx` (Task 13's container-style `describe`). The contract's Interfaces name a `wiring.test.tsx` for this; no 8a.3 or 8a.5 task creates it, so this task uses the file that exists. Transient scope is also asserted by `ReviewListPresenter.test.ts` ("keeps two presenters independent").
- `src/index.tsx` is not edited here (R-k: nothing imports these names through the bare barrel).
