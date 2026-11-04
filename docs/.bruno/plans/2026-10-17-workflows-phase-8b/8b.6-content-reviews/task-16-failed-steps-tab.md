### Task 16: Failed steps tab and row restart

R202, R210, R220, R229, R237, R238, R243, R259, R264, R266; D34, D82, D112, D162; QBZ-29, QBZ-69, QBZ-85; Review Focus 7, 8. Spec 11 (Failed steps list), 13.4/13.5 (8b parts). Content Reviews gets a fifth tab, **Failed steps**, shown only to viewers with `reassign` or full access (the server refuses the `failedSteps` list otherwise, so the client never asks for it, R259). The presenter exposes the visible tabs as `vm.tabs` and the tab component renders them. `?tab=failedSteps` parses to the tab, and the presenter falls back to the default tab when the viewer may not see it. The tab lists AI and automation steps in `failed`, oldest first (QBZ-69), with search and the content type filter only (QBZ-29: no state filters; the toolbar already shows the review and step state selects on My requests only, and the list request already sends the state filters only there). A row with `flags.canRestart` shows an inline **Restart** button that opens Task 11's restart dialog on the row's use cases with `listRefreshed`; the conflict text and the toast are Task 11's (R266). After a restart the existing own-action path refetches the list once and the restarted row leaves the tab (R210).

- **Order:** Task 16 applies on top of Task 10's committed `ReviewListPresenter.ts` changes (the widened `notify` calls); the hunks below do not touch them.
- **Copy** (verbatim from `research-spec.md` 4c "Content Reviews, Failed steps tab" and QBZ-29):
  - Tab label `Failed steps`.
  - Empty state title `No failed steps`, description `AI and automation steps that hit a technical error appear here.` The filtered empty state stays the shared `No reviews match these filters`.
  - Row action label `Restart` (Task 11's `getReviewActions`), shown as an inline secondary button like Start and Take over; `Cancel review` and `Review details` stay in the row menu.
  - The step tag `Failed` and the owner cell (the step title for an AI or automation owner, QBZ-79) are the shared row rendering; nothing changes there.
- **Gate:** `fullAccess || reassign` of `getWorkflowsPermissionSet(identity)` (Task 10, R259). `editor` alone does not open the tab (the server's `ListCmsEntryReviews` wrapper requires `reassign` for `failedSteps`). `init` with `initialTab: "failedSteps"` and no permission starts on `assignedToMe`; `setTab("failedSteps")` without permission does nothing. The permission is read inline from `IdentityContext` where it is used (no wrapper method around the dependency call, 8a Global Constraints).
- **Sort:** `getDefaultReviewListSort("failedSteps")` is already `lastChangedOn_ASC` (every tab but My requests), so only its comment changes and a test pins it.

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewList/isReviewListTabAvailable.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewList/getVisibleReviewListTabs.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/reviewListTabs.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/getReviewListEmpty.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/getDefaultReviewListSort.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListTabs.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListRowActions.tsx`
- Modify (tests): `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`, `ReviewListPresenter.test.ts`, `components/ReviewListView.test.tsx`, `components/ReviewListToolbar.test.tsx`, `packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx`

**Interfaces:**
- Consumes: Task 10 (`getWorkflowsPermissionSet(identity: Identity): WorkflowsPermissionSet` from `~/review/domain/getWorkflowsPermissionSet.js`, `WorkflowsPermissionSet { fullAccess: boolean; editor: boolean; reassign: boolean }` from `~/review/domain/types.js`), Task 11 (`TargetReviewActionKind` has `restart` with label `Restart` and icon `refresh`; `getListRowActions` returns it for `flags.canRestart`; `ReviewActionKind` has `restart`, so `ReviewListDialogKind` and `openRowAction` accept it; `ReviewActionDialogs` runs the restart dialog), Task 8 (`restartStep`). Task 10 (`createWorkflowsIdentityContext(params?: WorkflowsIdentityParams): IdentityContext.Interface` from `~/review/testing/createWorkflowsIdentityContext.js`, `WorkflowsIdentityParams { teams?: ITeam[]; permissions?: Identity.Permission[] }`, real `Identity.createAuthenticated`). Existing (verified): `ReviewListPresenter` (`IdentityContext` already injected for `hasTeams`), `ReviewListKind` already lists `failedSteps` (`~/review/domain/ReviewListKind.ts`), `ListReviewsParams.list: ReviewListKind` so `createParams` sends `list: this._tab` unchanged, `ReviewListToolbar` (filters by `vm.tab === "myRequests"`), `ReviewListDialogs` (already passes `listRefreshed={true}` and `onDone={() => presenter.actionDone()}`), `Identity` and `IPermission` from `@webiny/app-admin/domain/Identity.js` (`Identity.createAuthenticated(data)`; `getPermission`/`getPermissions` match by name and by pattern), admin-ui `Tabs`.
- Produces: `ReviewListTab` gains `"failedSteps"`; `ReviewListTabVm { value: ReviewListTab; label: string }` (replaces `ReviewListTabDefinition`); `IReviewListViewModel.tabs: ReviewListTabVm[]`; `getVisibleReviewListTabs(permissions: WorkflowsPermissionSet): ReviewListTabVm[]`; `isReviewListTabAvailable(tab: ReviewListTab, permissions: WorkflowsPermissionSet): boolean`. Nothing later consumes them.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

**Existing tests this task changes** (every other list test stays as is):
- `ReviewListPresenter.test.ts` and `components/ReviewListView.test.tsx` register an identity stub `{ teams } as unknown as Identity`. The presenter now calls `getWorkflowsPermissionSet(identity)`, which needs `getPermission`/`getPermissions`, so both files build their identity context with Task 10's `createWorkflowsIdentityContext`.
- `components/ReviewListToolbar.test.tsx`: its `createVm` gains the new `tabs` field (otherwise the build fails).
- `reviewListPure.test.ts`: the tab list test now expects five tabs and `parseReviewListTab("failedSteps")` is `"failedSteps"` (was `null`).
- `ReviewMountingComponents.test.tsx`: the `?tab=failedSteps` case now expects `data-initial-tab` `failedSteps` (was `""`); the "ignored" case uses an unknown value instead.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts`.

Imports. Before:

```ts
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
```

After:

```ts
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
```

Before:

```ts
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
```

After:

```ts
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { getVisibleReviewListTabs } from "./getVisibleReviewListTabs.js";
import { hasRowChanged } from "./hasRowChanged.js";
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { isReviewListTabAvailable } from "./isReviewListTabAvailable.js";
```

Before:

```ts
const row = (overrides: ReviewListItemOverrides = {}) => {
    return toReviewListRow(createReviewListItem(overrides));
};
```

After:

```ts
const row = (overrides: ReviewListItemOverrides = {}) => {
    return toReviewListRow(createReviewListItem(overrides));
};

const permissions = (overrides: Partial<WorkflowsPermissionSet> = {}): WorkflowsPermissionSet => {
    return { fullAccess: false, editor: false, reassign: false, ...overrides };
};
```

The sort test. Before:

```ts
        expect(getDefaultReviewListSort("teamInReview")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("myRequests")).toBe("lastChangedOn_DESC");
    });
```

After:

```ts
        expect(getDefaultReviewListSort("teamInReview")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("failedSteps")).toBe("lastChangedOn_ASC");
        expect(getDefaultReviewListSort("myRequests")).toBe("lastChangedOn_DESC");
    });
```

The empty-state test: add a new test right before `it("lists the four tabs in design order and parses a tab value", ...)` (below, in the replacement). The tab list test. Before:

```ts
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
```

After:

```ts
    it("has the Failed steps empty state (QBZ-29) and the shared filtered state", () => {
        expect(getReviewListEmpty("failedSteps", false, true)).toEqual({
            title: "No failed steps",
            description: "AI and automation steps that hit a technical error appear here."
        });
        expect(getReviewListEmpty("failedSteps", false, false).title).toBe("No failed steps");
        expect(getReviewListEmpty("failedSteps", true, true)).toEqual({
            title: "No reviews match these filters",
            description: ""
        });
    });

    it("lists the five tabs in design order and parses a tab value", () => {
        expect(REVIEW_LIST_TABS.map(tab => tab.label)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests",
            "Failed steps"
        ]);
        expect(REVIEW_LIST_TABS[4].value).toBe("failedSteps");
        expect(parseReviewListTab("pool")).toBe("pool");
        expect(parseReviewListTab("myRequests")).toBe("myRequests");
        expect(parseReviewListTab("failedSteps")).toBe("failedSteps");
        expect(parseReviewListTab("nonsense")).toBeNull();
        expect(parseReviewListTab(undefined)).toBeNull();
    });

    it("opens Failed steps only with reassign or full access and every other tab to everyone (QBZ-29, R259)", () => {
        const none = permissions();
        const editorOnly = permissions({ editor: true });
        const reassign = permissions({ reassign: true });
        const fullAccess = permissions({ fullAccess: true, editor: true, reassign: true });

        expect(isReviewListTabAvailable("failedSteps", none)).toBe(false);
        expect(isReviewListTabAvailable("failedSteps", editorOnly)).toBe(false);
        expect(isReviewListTabAvailable("failedSteps", reassign)).toBe(true);
        expect(isReviewListTabAvailable("failedSteps", fullAccess)).toBe(true);
        expect(isReviewListTabAvailable("failedSteps", permissions({ fullAccess: true }))).toBe(
            true
        );
        expect(isReviewListTabAvailable("assignedToMe", none)).toBe(true);
        expect(isReviewListTabAvailable("pool", none)).toBe(true);
        expect(isReviewListTabAvailable("teamInReview", none)).toBe(true);
        expect(isReviewListTabAvailable("myRequests", none)).toBe(true);
    });

    it("lists four visible tabs without reassign and five with it, in design order", () => {
        const four = ["assignedToMe", "pool", "teamInReview", "myRequests"];

        expect(getVisibleReviewListTabs(permissions()).map(tab => tab.value)).toEqual(four);
        expect(getVisibleReviewListTabs(permissions({ editor: true })).map(tab => tab.value)).toEqual(
            four
        );
        const five = getVisibleReviewListTabs(permissions({ reassign: true }));
        expect(five.map(tab => tab.value)).toEqual([...four, "failedSteps"]);
        expect(five[4]).toEqual({ value: "failedSteps", label: "Failed steps" });
    });
```

The row action test. Before:

```ts
        expect(actions.find(action => action.kind === "start")?.label).toBe("Start");
        expect(actions.find(action => action.kind === "cancel")?.label).toBe("Cancel review");
    });
```

After:

```ts
        expect(actions.find(action => action.kind === "start")?.label).toBe("Start");
        expect(actions.find(action => action.kind === "cancel")?.label).toBe("Cancel review");
    });

    it("offers Restart on a failed step only with canRestart (Task 11, D34)", () => {
        expect(
            getListRowActions(row({ stepState: StepState.Failed, flags: { canCancel: true } })).map(
                action => action.kind
            )
        ).toEqual(["cancel"]);

        const actions = getListRowActions(
            row({
                stepId: "step-4",
                stepState: StepState.Failed,
                flags: { canRestart: true, canCancel: true }
            })
        );

        expect(actions.map(action => action.kind).sort()).toEqual(["cancel", "restart"]);
        const restart = actions.find(action => action.kind === "restart");
        expect(restart?.label).toBe("Restart");
        expect(restart?.stepId).toBe("step-4");
    });
```

Modify `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts`.

Imports. Before:

```ts
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
```

After:

```ts
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
```

Before:

```ts
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { ReviewListPresenter } from "./abstractions.js";
```

After:

```ts
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { ReviewListPresenter } from "./abstractions.js";
```

Identity and setup. Before:

```ts
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
```

After:

```ts
const REASSIGN: IPermission[] = [{ name: "workflows", reassign: true }];

const createIdentityContext = (
    teamCount: number,
    permissions: IPermission[]
): IdentityContext.Interface => {
    const teams: ITeam[] = Array.from({ length: teamCount }, (_, index) => {
        return { id: `team-${index}`, slug: `team-${index}`, name: `Team ${index}` };
    });
    return createWorkflowsIdentityContext({ teams, permissions });
};

const setup = (teamCount = 1, permissions: IPermission[] = []) => {
    const container = new Container();
    container.register(ReviewActivityImplementation).inSingletonScope();
    container.registerInstance(IdentityContext, createIdentityContext(teamCount, permissions));
```

Add the Failed steps block. Before (the line exists once):

```ts
    describe("search draft", () => {
```

After:

```ts
    describe("Failed steps tab (QBZ-29, QBZ-69, R259)", () => {
        const TAB_LABELS = [
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests"
        ];

        interface PermissionCase {
            permissions: IPermission[];
            failedSteps: boolean;
        }

        const createFailedItem = (id: string) => {
            return createReviewListItem({
                id,
                stepId: "step-5",
                stepTitle: "AI tone check",
                stepState: StepState.Failed,
                owner: createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" }),
                flags: { canRestart: true, canCancel: true }
            });
        };

        it("lists four tabs without reassign and five with it, over several roles, workflows.* and *", async () => {
            const cases: PermissionCase[] = [
                { permissions: [], failedSteps: false },
                { permissions: [{ name: "workflows", editor: true }], failedSteps: false },
                { permissions: [{ name: "workflows", reassign: true }], failedSteps: true },
                { permissions: [{ name: "workflows.*" }], failedSteps: true },
                { permissions: [{ name: "*" }], failedSteps: true },
                {
                    permissions: [
                        { name: "workflows", editor: true },
                        { name: "workflows", reassign: true }
                    ],
                    failedSteps: true
                }
            ];

            for (const current of cases) {
                const { presenter, listReviews, params } = setup(1, current.permissions);
                listReviews.mockResolvedValue(page([]));
                await presenter.init(params);

                const labels = presenter.vm.tabs.map(tab => tab.label);
                if (current.failedSteps) {
                    expect(labels).toEqual([...TAB_LABELS, "Failed steps"]);
                } else {
                    expect(labels).toEqual(TAB_LABELS);
                }
            }
        });

        it("starts on the default tab when the route asks for Failed steps without permission", async () => {
            const { presenter, listReviews, params } = setup();
            listReviews.mockResolvedValue(page([]));

            await presenter.init({ ...params, initialTab: "failedSteps" });

            expect(presenter.vm.tab).toBe("assignedToMe");
            expect(listReviews).toHaveBeenCalledTimes(1);
            expect(listReviews).toHaveBeenCalledWith({
                list: "assignedToMe",
                where: {},
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
        });

        it("starts on Failed steps for a viewer with reassign, oldest first", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([]));

            await presenter.init({ ...params, initialTab: "failedSteps" });

            expect(presenter.vm.tab).toBe("failedSteps");
            expect(presenter.vm.sort).toBe("lastChangedOn_ASC");
            expect(listReviews).toHaveBeenCalledTimes(1);
            expect(listReviews).toHaveBeenCalledWith({
                list: "failedSteps",
                where: {},
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
        });

        it("refuses to switch to Failed steps without permission and sends no request", async () => {
            const { presenter, listReviews, params } = setup(1, [
                { name: "workflows", editor: true }
            ]);
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);

            await presenter.setTab("failedSteps");

            expect(presenter.vm.tab).toBe("assignedToMe");
            expect(listReviews).toHaveBeenCalledTimes(1);
        });

        it("switches to Failed steps with permission and sends the search and the content type but never a state filter", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([]));
            await presenter.init(params);

            await presenter.setTab("failedSteps");

            expect(listReviews).toHaveBeenLastCalledWith({
                list: "failedSteps",
                where: {},
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
            expect(presenter.vm.empty).toEqual({
                title: "No failed steps",
                description: "AI and automation steps that hit a technical error appear here."
            });

            await presenter.setSearch("  tone  ");
            await presenter.setContentType("article");
            await presenter.setReviewState(ReviewState.Approved);
            await presenter.setStepState(StepState.Awaiting);

            expect(listReviews).toHaveBeenLastCalledWith({
                list: "failedSteps",
                where: { titleContains: "tone", modelId: "article" },
                sort: "lastChangedOn_ASC",
                limit: REVIEW_LIST_PAGE_SIZE,
                after: null
            });
            expect(presenter.vm.empty?.title).toBe("No reviews match these filters");
        });

        it("resets the sort when leaving Failed steps for My requests", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([]));
            await presenter.init({ ...params, initialTab: "failedSteps" });
            await presenter.toggleSort();
            expect(presenter.vm.sort).toBe("lastChangedOn_DESC");

            await presenter.setTab("failedSteps");
            expect(presenter.vm.sort).toBe("lastChangedOn_ASC");

            await presenter.setTab("myRequests");
            expect(presenter.vm.sort).toBe("lastChangedOn_DESC");
        });

        it("renders a failed row with the Failed tag, the step title as owner and Restart and Cancel review", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValue(page([createFailedItem("f1")]));

            await presenter.init({ ...params, initialTab: "failedSteps" });

            const row = presenter.vm.rows[0];
            expect(row.stepStateLabel).toBe("Failed");
            expect(row.stepStateVariant).toBe("destructive");
            expect(row.stepTitle).toBe("AI tone check");
            expect(row.ownerLabel).toBe("AI tone check");
            expect(row.actions.map(action => action.kind).sort()).toEqual(["cancel", "restart"]);
            const restart = row.actions.find(action => action.kind === "restart");
            expect(restart?.label).toBe("Restart");
            expect(restart?.stepId).toBe("step-5");
        });

        it("opens the restart dialog of a row and, once it is done, refetches once and lets the row leave", async () => {
            const { presenter, listReviews, params } = setup(1, REASSIGN);
            listReviews.mockResolvedValueOnce(page([createFailedItem("f1")]));
            await presenter.init({ ...params, initialTab: "failedSteps" });

            presenter.openRowAction("f1", "restart", "step-5");

            expect(presenter.vm.dialog).toEqual({
                kind: "restart",
                namespace: "cms.article",
                reviewId: "f1",
                stepId: "step-5"
            });

            listReviews.mockResolvedValueOnce(page([]));
            presenter.actionDone();

            expect(presenter.vm.dialog).toBeNull();
            await vi.waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
            expect(listReviews).toHaveBeenLastCalledWith(
                expect.objectContaining({ list: "failedSteps" })
            );
            await vi.waitFor(() => expect(presenter.vm.rows[0].leaving).toBe(true));
        });
    });

    describe("search draft", () => {
```

Modify `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx`.

Imports. Before:

```ts
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
```

After:

```ts
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
```

Before:

```ts
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
```

After:

```ts
import { createActor } from "~/review/testing/createActor.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
```

Render options and identity. Before:

```ts
interface RenderOptions {
    results?: ListResult[];
    showContentType?: boolean;
    contentTypeFilter?: IReviewContentTypeFilter | null;
    initialTab?: ReviewListTab;
}
```

After:

```ts
const REASSIGN: IPermission[] = [{ name: "workflows", reassign: true }];

interface RenderOptions {
    results?: ListResult[];
    showContentType?: boolean;
    contentTypeFilter?: IReviewContentTypeFilter | null;
    initialTab?: ReviewListTab;
    permissions?: IPermission[];
}
```

Before:

```ts
    const identity = {
        teams: [{ id: "team-1", slug: "team-1", name: "Team 1" }]
    } as unknown as Identity;
    container.registerInstance(IdentityContext, {
        getIdentity: () => identity,
        setIdentity: vi.fn(),
        clear: vi.fn()
    });
```

After:

```ts
    const teams: ITeam[] = [{ id: "team-1", slug: "team-1", name: "Team 1" }];
    const identityContext = createWorkflowsIdentityContext({
        teams,
        permissions: options.permissions
    });
    container.registerInstance(IdentityContext, identityContext);
```

New tests. Before (the line exists once):

```ts
    it("shows the Content type column and filter only when the app asks for them (D113)", async () => {
```

After:

```ts
    it("renders the Failed steps tab as the fifth tab for a viewer with reassign (QBZ-29)", async () => {
        renderView({ permissions: REASSIGN });

        const tabs = await screen.findAllByRole("tab");

        expect(tabs.map(tab => tab.textContent)).toEqual([
            "Assigned to me",
            "Team pool",
            "Team in review",
            "My requests",
            "Failed steps"
        ]);
    });

    it("has no Failed steps tab for a viewer with the editor permission only", async () => {
        renderView({ permissions: [{ name: "workflows", editor: true }] });

        const tabs = await screen.findAllByRole("tab");

        expect(tabs.map(tab => tab.textContent)).not.toContain("Failed steps");
        expect(tabs).toHaveLength(4);
    });

    it("opens the tab named by the route with reassign and shows its empty state (QBZ-29)", async () => {
        const { listReviews } = renderView({ initialTab: "failedSteps", permissions: REASSIGN });

        expect(await screen.findByText("No failed steps")).toBeTruthy();
        expect(
            screen.getByText("AI and automation steps that hit a technical error appear here.")
        ).toBeTruthy();
        expect(listReviews).toHaveBeenCalledWith(
            expect.objectContaining({ list: "failedSteps", sort: "lastChangedOn_ASC" })
        );
        const tab = screen.getByRole("tab", { name: "Failed steps" });
        expect(tab.getAttribute("aria-selected")).toBe("true");
    });

    it("falls back to the default tab when the route asks for Failed steps without permission", async () => {
        const { listReviews } = renderView({ initialTab: "failedSteps" });

        expect(await screen.findByText("Nothing assigned to you")).toBeTruthy();
        expect(listReviews).toHaveBeenCalledTimes(1);
        expect(listReviews).toHaveBeenCalledWith(
            expect.objectContaining({ list: "assignedToMe" })
        );
        expect(screen.queryByRole("tab", { name: "Failed steps" })).toBeNull();
    });

    it("switches to the Failed steps tab from the tab bar", async () => {
        const { listReviews } = renderView({
            permissions: REASSIGN,
            results: [page([]), page([])]
        });
        await screen.findByText("Nothing assigned to you");

        fireEvent.mouseDown(await screen.findByRole("tab", { name: "Failed steps" }));

        expect(await screen.findByText("No failed steps")).toBeTruthy();
        expect(listReviews).toHaveBeenLastCalledWith(
            expect.objectContaining({ list: "failedSteps", sort: "lastChangedOn_ASC" })
        );
    });

    it("lists a failed step with its tag, the step title as owner and an inline Restart (QBZ-29, QBZ-79)", async () => {
        renderView({
            initialTab: "failedSteps",
            permissions: REASSIGN,
            results: [
                page([
                    createReviewListItem({
                        id: "f1",
                        title: "Spring campaign",
                        stepId: "step-5",
                        stepTitle: "AI tone check",
                        stepState: StepState.Failed,
                        owner: createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" }),
                        flags: { canRestart: true, canCancel: true }
                    })
                ])
            ]
        });
        await screen.findByText("Spring campaign");

        const row = within(rowOf("Spring campaign"));
        expect(row.getByText("Failed")).toBeTruthy();
        expect(row.getAllByText("AI tone check")).toHaveLength(2);
        expect(row.getByRole("button", { name: "Restart" })).toBeTruthy();

        const more = row.getByRole("button", { name: "More actions" });
        fireEvent.keyDown(more, { key: "Enter" });
        expect(await screen.findByRole("menuitem", { name: "Cancel review" })).toBeTruthy();
        expect(screen.queryByRole("menuitem", { name: "Restart" })).toBeNull();
    });

    it("opens the restart dialog on the row's use cases with listRefreshed and refetches once when it is done (R210, R266)", async () => {
        const { listReviews } = renderView({
            initialTab: "failedSteps",
            permissions: REASSIGN,
            results: [
                page([
                    createReviewListItem({
                        id: "f1",
                        title: "Spring campaign",
                        stepId: "step-5",
                        stepState: StepState.Failed,
                        owner: createActor({ id: "ai-1", displayName: "gpt-model", type: "ai" }),
                        flags: { canRestart: true }
                    })
                ]),
                page([])
            ]
        });
        await screen.findByText("Spring campaign");

        fireEvent.click(within(rowOf("Spring campaign")).getByRole("button", { name: "Restart" }));

        const dialogs = await screen.findByTestId("action-dialogs");
        expect(dialogs.getAttribute("data-kind")).toBe("restart");
        expect(dialogs.getAttribute("data-review")).toBe("f1");
        expect(dialogs.getAttribute("data-step")).toBe("step-5");
        expect(dialogs.getAttribute("data-usecases")).toBe("cms");
        expect(dialogs.getAttribute("data-list-refreshed")).toBe("true");

        fireEvent.click(screen.getByText("stub done"));

        await waitFor(() => expect(listReviews).toHaveBeenCalledTimes(2));
        expect(screen.queryByTestId("action-dialogs")).toBeNull();
    });

    it("offers no Restart on a row whose flags do not allow it (D34)", async () => {
        renderView({
            results: [
                page([
                    createReviewListItem({
                        id: "p1",
                        title: "Plain review",
                        flags: { canStart: true }
                    })
                ])
            ]
        });
        await screen.findByText("Plain review");

        expect(within(rowOf("Plain review")).queryByRole("button", { name: "Restart" })).toBeNull();
    });

    it("shows the Content type column and filter only when the app asks for them (D113)", async () => {
```

Modify `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx`.

Before:

```ts
import type { ReviewListPresenter } from "../abstractions.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";
```

After:

```ts
import type { ReviewListPresenter } from "../abstractions.js";
import { REVIEW_LIST_TABS } from "../reviewListTabs.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";
```

Before:

```ts
        tab: "assignedToMe",
        rows: [],
```

After:

```ts
        tab: "assignedToMe",
        tabs: REVIEW_LIST_TABS,
        rows: [],
```

New test. Before (the end of the file):

```ts
        expect(screen.getAllByRole("combobox")).toHaveLength(3);
    });
});
```

After:

```ts
        expect(screen.getAllByRole("combobox")).toHaveLength(3);
    });

    it("shows the search and the content type filter only on Failed steps (QBZ-29)", () => {
        const filter = { options: [{ label: "Article", value: "article" }] };

        render(
            <ReviewListToolbar
                presenter={createPresenter(createVm({ tab: "failedSteps" }))}
                showContentType={true}
                contentTypeFilter={filter}
            />
        );

        expect(screen.getByPlaceholderText("Search by title")).toBeTruthy();
        expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });
});
```

Modify `packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx`. Before:

```ts
        routeState.tab = "failedSteps";
        render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe("");
    });
```

After:

```ts
        routeState.tab = "failedSteps";
        const second = render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        // The route parses the tab; the list presenter decides whether the viewer may open it.
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe(
            "failedSteps"
        );
        second.unmount();

        routeState.tab = "nonsense";
        render(
            <ReviewContentReviewsRoute
                route={route}
                useCases={useCases}
                rowProvider={rowProvider}
                namespaces={["cms.article"]}
                showContentType={true}
                contentTypeFilter={null}
                breadcrumbName="cms.content-reviews"
            />
        );
        expect(screen.getByTestId("list-view").getAttribute("data-initial-tab")).toBe("");
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx 2>&1 | tail -30
```

Expected: `reviewListPure.test.ts` fails with `Failed to resolve import "./getVisibleReviewListTabs.js"`. The presenter tests fail on `presenter.vm.tabs` being `undefined` (`Cannot read properties of undefined (reading 'map')`) and on the Failed steps requests (`setTab("failedSteps")` sends `list: "failedSteps"` without permission, the `init` fallback keeps `failedSteps`); the older presenter tests still pass. The view tests fail on the missing fifth tab and the missing `No failed steps` text. The toolbar test file still passes (`tabs` is an extra field at runtime; its type error shows in Step 5's build). The mounting test fails with `expected '' to be 'failedSteps'`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/presentation/reviewList/isReviewListTabAvailable.ts`:

```ts
import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
import type { ReviewListTab } from "./abstractions.js";

/*
 * Every tab is open to every viewer except Failed steps, which the server lists only for a viewer
 * with `reassign` or full access (D112, D162). A display gate (R259): the server keeps its check.
 */
export const isReviewListTabAvailable = (
    tab: ReviewListTab,
    permissions: WorkflowsPermissionSet
): boolean => {
    if (tab !== "failedSteps") {
        return true;
    }
    return permissions.fullAccess || permissions.reassign;
};
```

Create `packages/app-workflows/src/review/presentation/reviewList/getVisibleReviewListTabs.ts`:

```ts
import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
import type { ReviewListTabVm } from "./abstractions.js";
import { isReviewListTabAvailable } from "./isReviewListTabAvailable.js";
import { REVIEW_LIST_TABS } from "./reviewListTabs.js";

// The tabs this viewer may open, in design order (README 8, QBZ-29).
export const getVisibleReviewListTabs = (permissions: WorkflowsPermissionSet): ReviewListTabVm[] => {
    return REVIEW_LIST_TABS.filter(tab => {
        return isReviewListTabAvailable(tab.value, permissions);
    });
};
```

Modify `packages/app-workflows/src/review/presentation/reviewList/abstractions.ts`.

Before:

```ts
export type ReviewListTab = "assignedToMe" | "pool" | "teamInReview" | "myRequests";
```

After:

```ts
export type ReviewListTab =
    | "assignedToMe"
    | "pool"
    | "teamInReview"
    | "myRequests"
    | "failedSteps";

export interface ReviewListTabVm {
    value: ReviewListTab;
    label: string;
}
```

Before:

```ts
export interface IReviewListViewModel {
    tab: ReviewListTab;
    rows: ReviewListRowVm[];
```

After:

```ts
export interface IReviewListViewModel {
    tab: ReviewListTab;
    // The tabs this viewer may open (Failed steps only with `reassign` or full access, R259).
    tabs: ReviewListTabVm[];
    rows: ReviewListRowVm[];
```

Replace `packages/app-workflows/src/review/presentation/reviewList/reviewListTabs.ts` with:

```ts
import type { ReviewListTabVm } from "./abstractions.js";

/*
 * All five tabs in design order (README 8, QBZ-29). Failed steps is shown only to viewers with
 * `reassign` (R259); `getVisibleReviewListTabs` filters it, and the route parser accepts every
 * value here.
 */
export const REVIEW_LIST_TABS: ReviewListTabVm[] = [
    { value: "assignedToMe", label: "Assigned to me" },
    { value: "pool", label: "Team pool" },
    { value: "teamInReview", label: "Team in review" },
    { value: "myRequests", label: "My requests" },
    { value: "failedSteps", label: "Failed steps" }
];
```

Modify `packages/app-workflows/src/review/presentation/reviewList/getReviewListEmpty.ts`. Before:

```ts
    myRequests: {
        title: "You haven’t requested any reviews",
        description: "Request a review from the review bar in the content editor."
    }
};
```

After:

```ts
    myRequests: {
        title: "You haven’t requested any reviews",
        description: "Request a review from the review bar in the content editor."
    },
    failedSteps: {
        title: "No failed steps",
        description: "AI and automation steps that hit a technical error appear here."
    }
};
```

Modify `packages/app-workflows/src/review/presentation/reviewList/getDefaultReviewListSort.ts`. Before:

```ts
// Work queues list the longest-waiting item first, My requests the newest change first (QBZ-69).
```

After:

```ts
// Work queues (Assigned to me, Team pool, Team in review, Failed steps) list the longest-waiting
// item first, My requests the newest change first (QBZ-69).
```

Modify `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts`.

Imports. Before:

```ts
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
```

After:

```ts
import { REVIEW_LIST_PAGE_SIZE } from "~/review/domain/constants.js";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";
```

Before:

```ts
import { getReviewListEmpty } from "./getReviewListEmpty.js";
```

After:

```ts
import { getReviewListEmpty } from "./getReviewListEmpty.js";
import { getVisibleReviewListTabs } from "./getVisibleReviewListTabs.js";
```

Before:

```ts
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
```

After:

```ts
import { isBeyondRefetchWindow } from "./isBeyondRefetchWindow.js";
import { isReviewListTabAvailable } from "./isReviewListTabAvailable.js";
```

The view model. Before:

```ts
        const hasTeams = this.identityContext.getIdentity().teams.length > 0;
```

After:

```ts
        const hasTeams = this.identityContext.getIdentity().teams.length > 0;
        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        const tabs = getVisibleReviewListTabs(permissions);
```

Before:

```ts
        return {
            tab: this._tab,
            rows,
```

After:

```ts
        return {
            tab: this._tab,
            tabs,
            rows,
```

`init`. Before:

```ts
        this.rowProvider = params.rowProvider;
        this._tab = params.initialTab;
        this._sort = getDefaultReviewListSort(params.initialTab);
```

After:

```ts
        this.rowProvider = params.rowProvider;
        // A tab the viewer may not open (`?tab=failedSteps` without `reassign`) falls back to the
        // default tab, so the server's refusal is never provoked (R259).
        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        let initialTab = params.initialTab;
        if (!isReviewListTabAvailable(initialTab, permissions)) {
            initialTab = "assignedToMe";
        }
        this._tab = initialTab;
        this._sort = getDefaultReviewListSort(initialTab);
```

`setTab`. Before:

```ts
    async setTab(tab: ReviewListTab): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        this._tab = tab;
```

After:

```ts
    async setTab(tab: ReviewListTab): Promise<void> {
        const useCases = this.useCases;
        if (!useCases) {
            return;
        }

        const permissions = getWorkflowsPermissionSet(this.identityContext.getIdentity());
        if (!isReviewListTabAvailable(tab, permissions)) {
            return;
        }

        this._tab = tab;
```

Replace `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListTabs.tsx` with:

```tsx
import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListTab } from "../parseReviewListTab.js";

export interface ReviewListTabsProps {
    presenter: ReviewListPresenter.Interface;
}

// Renders the tabs the viewer may open (`vm.tabs`): Failed steps only with `reassign` (R259).
export const ReviewListTabs = createReactiveComponent(({ presenter }: ReviewListTabsProps) => {
    const tabs = presenter.vm.tabs.map(tab => {
        return <Tabs.Tab key={tab.value} value={tab.value} trigger={tab.label} content={null} />;
    });

    const onValueChange = (value: string) => {
        const tab = parseReviewListTab(value);
        if (!tab) {
            return;
        }
        void presenter.setTab(tab);
    };

    return <Tabs value={presenter.vm.tab} onValueChange={onValueChange} tabs={tabs} />;
});
```

Modify `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListRowActions.tsx`. Before:

```tsx
/*
 * Start and Take over are buttons in the row, the other actions and Review details sit in the menu.
 * A row without a binding (no content URL) has neither (R206).
 */
```

After:

```tsx
/*
 * Start, Take over and Restart are buttons in the row (Restart is the inline button of the Failed
 * steps tab, QBZ-29, shown on any row whose flags allow it), the other actions and Review details
 * sit in the menu. A row without a binding (no content URL) has neither (R206).
 */
```

Before:

```tsx
    const inline = row.actions.filter(action => {
        return action.kind === "start" || action.kind === "takeOver";
    });
    const menu = row.actions.filter(action => {
        return action.kind !== "start" && action.kind !== "takeOver";
    });
```

After:

```tsx
    const inline = row.actions.filter(action => {
        return action.kind === "start" || action.kind === "takeOver" || action.kind === "restart";
    });
    const menu = row.actions.filter(action => {
        return action.kind !== "start" && action.kind !== "takeOver" && action.kind !== "restart";
    });
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx 2>&1 | tail -30
```

Expected: PASS. If `row.actions` has no `restart`, Task 11 is not applied: stop and finish it first.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.test.ts packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx packages/app-workflows/src/review/mounting/components/ReviewMountingComponents.test.tsx packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the widgets and the Content Reviews route do not read `vm.tabs`; `app.test.tsx` only resolves registered tokens), no TypeScript errors (R243: the build is the type check, co-located tests included; `ReviewListToolbar.test.tsx` compiles only with the new `tabs` field in `createVm`).

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
git commit -m "feat(app-workflows): add the Failed steps tab and the row restart" -m "Content Reviews gets a fifth tab for viewers with reassign or full access. The list presenter exposes the visible tabs, refuses and falls back from a tab the viewer may not open, and the tab bar renders them. Failed steps lists AI and automation steps oldest first with the search and content type filters only, and a row whose flags allow it shows an inline Restart that opens the restart dialog with the list refreshed text." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No code change for sort and toolbar.** `getDefaultReviewListSort` already returns `lastChangedOn_ASC` for every tab but My requests, and `ReviewListToolbar` already shows the review and step state selects on My requests only (and `createParams` sends the state filters only there). The contract lists both files; only the sort comment changes, and tests pin both behaviours for `failedSteps`.
- **`ReviewListTabDefinition` is replaced by `ReviewListTabVm`** (declared in `abstractions.ts` so the view model can name it); the old interface was used only by `reviewListTabs.ts`.
- **Design icon not rendered.** The prototype's empty state has the `sync_problem` icon; `ReviewListEmpty` renders no illustration or icon for any tab (`illustration={false}`), so only the copy is built, as for the other tabs.
- **Design id `failed` versus code `failedSteps`.** The prototype's tab id is `failed`; the code uses the existing `ReviewListKind` value `failedSteps` for the tab, the route parameter and the GraphQL `list` argument.
- **Restart is inline on any row the flags allow** (design QBZ-29: "Restart and Cancel review also appear for the requester on their own rows in other tabs"), not only on Failed steps.
- **Gate is `fullAccess || reassign`.** R259's `reassign` already includes full access; the explicit `fullAccess` term is redundant and harmless, and keeps the predicate readable against the server's check.
- **Identity builder is Task 10's.** Both test files use `createWorkflowsIdentityContext` (real `Identity`, so `getWorkflowsPermissionSet` is exercised, not mocked); this task adds no test builder.
- **Depends on Task 11 for the row action.** `getListRowActions` must pass `restart` through (Task 11 owns that file); the new pure test pins it so a missing change fails here. The conflict text with "The list has been refreshed." and the toast are Task 11's; this task pins only that the list passes `listRefreshed` and refetches once.
- **Names from other tasks** (checked in the consistency pass): Task 10's `getWorkflowsPermissionSet`, `WorkflowsPermissionSet` and `createWorkflowsIdentityContext(params?)`, Task 11's `restart` kind in `getReviewActions`/`getListRowActions`/`ReviewActionKind`, Task 8's `restartStep` all exist with these names and signatures.
- Size: medium (three new files, seven modified source files, five modified test files).
