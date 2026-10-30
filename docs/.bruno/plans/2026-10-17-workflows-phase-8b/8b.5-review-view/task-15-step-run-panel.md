### Task 15: The task panel

R146, R257, R258, R264; D90, D161; Q33; design 4c (Attempts block, "Background task" link); Review Focus 2, 5. An operator opens the background task of an attempt from the drawer: the `Background task` link of an attempt row (Task 14's `showTaskLink`) loads the step run through `useCases.getStepRun` (Task 8, the per-app query of Tasks 5 and 6) and shows the `ReviewStepRunInfo` in a panel: status, start and end time, iterations and the fixed reason. The panel never shows the task input, output, logs or a raw error (R146: the server does not send them). A task that is gone shows `This task is no longer available.`

- **Copy** (verbatim, R264, Q37 item 6):
  - Heading `Background task`; rows `Status`, `Started`, `Finished`, `Iterations`, `Reason`.
  - Status labels: `pending` `Pending`, `running` `Running`, `done` `Done`, `failed` `Failed`, `aborted` `Aborted`.
  - Gone: `This task is no longer available.`
  - A failed load shows the 8a action error text (R220): `The server did not respond. Try again in a moment.` for a transport failure, the shared no-access text for `Workflows/NotAuthorized`, `This review no longer exists.` for `Workflows/Review/NotFound`, any other server message as received. The panel's close button reads `Close`.
  - Times use `formatReviewTimeFull` (the full date and time with timezone, QBZ-54).
- **Rows with nothing to show:** there is no copy for an empty value, so a row whose value is missing (`Started` or `Finished` without a time, `Reason` without a reason) is left out; `Status` and `Iterations` are always shown. The info's `outcome` is not shown (R264 lists five rows).
- **Presenter:** `openStepRun(stepId, taskId)` opens the panel loading, calls `useCases.getStepRun({ reviewId, stepId, taskId })` inline in a `try`/`catch`, and applies the result. A newer open wins over an older load (a token), `closeStepRun()` and `dispose` discard a load in flight, and a second `init` closes the panel. The panel state is part of the drawer's view model (`vm.stepRun`).
- **View:** `ReviewStepRunPanel` is an admin-ui `Dialog` (modal, over the drawer like the action dialogs) mounted by `ReviewDetailsDrawer`; the `Background task` link renders per attempt row when `showTaskLink` is true (and the row has a `taskId`).

**Files:**
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getStepRunPanel.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/getStepRunPanel.test.ts`
- Create: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewStepRunPanel.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`

**Interfaces:**
- Consumes: Task 8 (`ReviewStepRunInfo { taskId; status: StepRunTaskStatus; startedOn: string | null; finishedOn: string | null; iterations: number; outcome; reason: string | null }` from `~/review/domain/types.js`, `GetStepRunParams { reviewId; stepId; taskId }`, `IReviewReadUseCases.getStepRun(params): Promise<ReviewStepRunInfo | null>`, the fake `getStepRun` mock in `createFakeUseCases`, the builder `createStepRunInfo` from `~/review/testing/reviewFixtures.js`, `ReviewErrorCode.StepRunNotFound`), Task 14 (`ReviewAttemptVm.showTaskLink`, `ReviewDetailsPresenter` with `IdentityContext`, `createFakeActivity`, `createDeferred` and `createAiUseCases` in the drawer test, the drawer sections), Task 11 (`at` from `~/review/testing/at.js`), 8a (`formatReviewTimeFull`, `classifyReviewActionError`, `getActionErrorMessage`, `NO_ACCESS_MESSAGE`, `GraphQLOperationError`). Existing (verified with codegraph): admin-ui `Dialog` (`open`, `onOpenChange`, `title`, `loading`, `actions`, `Dialog.CancelAction`), `Alert`, `Button`, `Text`.
- Produces: `ReviewStepRunPanelVm { open: boolean; loading: boolean; error: string | null; gone: boolean; rows: ReviewStepRunPanelRowVm[] }`, `ReviewStepRunPanelRowVm { label: string; value: string }`, `IReviewDetailsViewModel.stepRun`, `IReviewDetailsPresenter.openStepRun(stepId: string, taskId: string): Promise<void>` and `.closeStepRun(): void`, `getStepRunPanel(input)`, the constants `STEP_RUN_PANEL_TITLE` and `STEP_RUN_GONE_TEXT`, `ReviewStepRunPanel`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/presentation/reviewDetails/getStepRunPanel.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getStepRunPanel } from "./getStepRunPanel.js";
import { STEP_RUN_GONE_TEXT } from "./getStepRunPanel.js";
import { STEP_RUN_PANEL_TITLE } from "./getStepRunPanel.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { at } from "~/review/testing/at.js";
import { createStepRunInfo } from "~/review/testing/reviewFixtures.js";

// A failed run on top of Task 8's builder defaults (done, approved, one iteration).
const FAILED_RUN: Partial<ReviewStepRunInfo> = {
    status: "failed",
    startedOn: at(9, 0),
    finishedOn: at(9, 5),
    iterations: 3,
    outcome: "failed",
    reason: "Provider unavailable: request timed out after 60 s"
};

const open = (info: ReviewStepRunInfo | null, overrides = {}) => {
    return getStepRunPanel({ open: true, loading: false, error: null, info, ...overrides });
};

describe("getStepRunPanel (R264)", () => {
    it("names the heading", () => {
        expect(STEP_RUN_PANEL_TITLE).toBe("Background task");
        expect(STEP_RUN_GONE_TEXT).toBe("This task is no longer available.");
    });

    it("is closed and empty while closed", () => {
        expect(getStepRunPanel({ open: false, loading: false, error: null, info: null })).toEqual({
            open: false,
            loading: false,
            error: null,
            gone: false,
            rows: []
        });
    });

    it("is loading and has no rows while loading, even if an old result is still there", () => {
        expect(open(createStepRunInfo(FAILED_RUN), { loading: true })).toEqual({
            open: true,
            loading: true,
            error: null,
            gone: false,
            rows: []
        });
    });

    it("shows the error and nothing else when the load failed", () => {
        expect(open(null, { error: "The server did not respond. Try again in a moment." })).toEqual({
            open: true,
            loading: false,
            error: "The server did not respond. Try again in a moment.",
            gone: false,
            rows: []
        });
    });

    it("is gone when the load returned no task", () => {
        expect(open(null)).toEqual({
            open: true,
            loading: false,
            error: null,
            gone: true,
            rows: []
        });
    });

    it("shows status, times, iterations and reason in that order", () => {
        const panel = open(createStepRunInfo(FAILED_RUN));

        expect(panel.gone).toBe(false);
        expect(panel.rows).toEqual([
            { label: "Status", value: "Failed" },
            { label: "Started", value: formatReviewTimeFull(at(9, 0)) },
            { label: "Finished", value: formatReviewTimeFull(at(9, 5)) },
            { label: "Iterations", value: "3" },
            { label: "Reason", value: "Provider unavailable: request timed out after 60 s" }
        ]);
        expect(panel.rows[1].value).toContain("2026");
    });

    it("labels every status", () => {
        const labels = (["pending", "running", "done", "failed", "aborted"] as const).map(status => {
            return open(createStepRunInfo({ ...FAILED_RUN, status })).rows[0].value;
        });

        expect(labels).toEqual(["Pending", "Running", "Done", "Failed", "Aborted"]);
    });

    it("leaves out the rows that have no value", () => {
        const panel = open(
            createStepRunInfo({ ...FAILED_RUN,
                status: "pending",
                startedOn: null,
                finishedOn: null,
                iterations: 0,
                reason: null
            })
        );

        expect(panel.rows).toEqual([
            { label: "Status", value: "Pending" },
            { label: "Iterations", value: "0" }
        ]);
    });

    it("leaves out a blank reason and an unparsable time", () => {
        const panel = open(createStepRunInfo({ ...FAILED_RUN, reason: "   ", startedOn: "not a date" }));

        expect(panel.rows.map(row => row.label)).toEqual(["Status", "Finished", "Iterations"]);
    });

    it("never shows the task id or the outcome", () => {
        const text = JSON.stringify(open(createStepRunInfo({ ...FAILED_RUN, taskId: "task-secret-1" })));

        expect(text).not.toContain("task-secret-1");
    });
});
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`. Add the import after `import type { ReviewAssignmentEntry } from "~/review/domain/types.js";`:

```ts
import type { ReviewStepRunPanelVm } from "./abstractions.js";
```

and, after `const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });`:

```ts
const CLOSED_STEP_RUN: ReviewStepRunPanelVm = {
    open: false,
    loading: false,
    error: null,
    gone: false,
    rows: []
};
```

In the `build` helper add `stepRun: CLOSED_STEP_RUN,` after `canViewStepRun,`:

```ts
            openAction: null,
            canViewStepRun,
            stepRun: CLOSED_STEP_RUN,
            now: NOW
```

and in both literal calls of `builds the loading and failed states without a header` after `canViewStepRun: false,`:

```ts
            canViewStepRun: false,
            stepRun: CLOSED_STEP_RUN,
            now: NOW
```

Add the test (anywhere inside `describe("buildReviewDetailsViewModel", ...)`, for example before `it("is render-ready: plain data only (R234)", ...)`; replace that anchor line pair

```ts
    it("is render-ready: plain data only (R234)", () => {
        const vm = build();
```

with the new test followed by the anchor):

```ts
    it("carries the step run panel in every state of the drawer", () => {
        const panel: ReviewStepRunPanelVm = {
            open: true,
            loading: false,
            error: null,
            gone: false,
            rows: [{ label: "Status", value: "Done" }]
        };
        const input = {
            error: null,
            openAction: null,
            canViewStepRun: true,
            stepRun: panel,
            now: NOW
        };

        const loaded = buildReviewDetailsViewModel({
            ...input,
            status: "loaded",
            review: createReviewWithFlags(createReview(), createFlags())
        });
        const loading = buildReviewDetailsViewModel({ ...input, status: "loading", review: null });
        const cancelled = buildReviewDetailsViewModel({
            ...input,
            status: "loaded",
            review: createReviewWithFlags(
                createReview({ state: ReviewState.Cancelled }),
                createFlags()
            )
        });

        expect(loaded.stepRun).toBe(panel);
        expect(loading.stepRun).toBe(panel);
        expect(cancelled.stepRun).toBe(panel);
    });

    it("is render-ready: plain data only (R234)", () => {
        const vm = build();
```

Modify `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts`. Add the imports after `import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";`:

```ts
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { createStepRunInfo } from "~/review/testing/reviewFixtures.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
```

(`at` is already imported by Task 14 in this file.)

Append at the end of the file:

```ts
describe("ReviewDetailsPresenter step run panel (R257, R264)", () => {
    // A failed run on top of Task 8's builder defaults.
    const FAILED_RUN: Partial<ReviewStepRunInfo> = {
        status: "failed",
        startedOn: at(9, 0),
        finishedOn: at(9, 5),
        iterations: 3,
        outcome: "failed",
        reason: "Provider unavailable"
    };

    const CLOSED = { open: false, loading: false, error: null, gone: false, rows: [] };

    const createLoaded = async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        return setup;
    };

    it("is closed until a task is opened", async () => {
        const setup = await createLoaded();

        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("loads the task by review, step and task id and shows its rows", async () => {
        const setup = await createLoaded();
        const info = createDeferred<ReviewStepRunInfo | null>();
        setup.useCases.getStepRun.mockReturnValue(info.promise);

        const pending = setup.presenter.openStepRun("step-1", "task-1");
        expect(setup.presenter.vm.stepRun.open).toBe(true);
        expect(setup.presenter.vm.stepRun.loading).toBe(true);
        info.resolve(createStepRunInfo(FAILED_RUN));
        await pending;

        expect(setup.useCases.getStepRun).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });
        const { stepRun } = setup.presenter.vm;
        expect(stepRun.loading).toBe(false);
        expect(stepRun.rows).toEqual([
            { label: "Status", value: "Failed" },
            { label: "Started", value: formatReviewTimeFull(at(9, 0)) },
            { label: "Finished", value: formatReviewTimeFull(at(9, 5)) },
            { label: "Iterations", value: "3" },
            { label: "Reason", value: "Provider unavailable" }
        ]);
    });

    it("says the task is gone when the use case returns null", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockResolvedValue(null);

        await setup.presenter.openStepRun("step-1", "task-1");

        expect(setup.presenter.vm.stepRun).toEqual({
            open: true,
            loading: false,
            error: null,
            gone: true,
            rows: []
        });
    });

    it("shows the 8a text for a transport failure", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockRejectedValue(new Error("Network."));

        await setup.presenter.openStepRun("step-1", "task-1");

        expect(setup.presenter.vm.stepRun.error).toBe(
            "The server did not respond. Try again in a moment."
        );
        expect(setup.presenter.vm.stepRun.rows).toEqual([]);
        expect(setup.presenter.vm.stepRun.gone).toBe(false);
    });

    it("shows the no-access text for a read that is not authorized", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.openStepRun("step-1", "task-1");

        expect(setup.presenter.vm.stepRun.error).toBe(NO_ACCESS_MESSAGE);
    });

    it("shows the server message of a task that is not on the step", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockRejectedValue(
            new GraphQLOperationError({
                message: "This task does not belong to the step.",
                code: ReviewErrorCode.StepRunNotFound
            })
        );

        await setup.presenter.openStepRun("step-1", "task-9");

        expect(setup.presenter.vm.stepRun.error).toBe("This task does not belong to the step.");
    });

    it("closes and clears the panel", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        await setup.presenter.openStepRun("step-1", "task-1");

        setup.presenter.closeStepRun();

        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("lets a newer open win over an older load", async () => {
        const setup = await createLoaded();
        const older = createDeferred<ReviewStepRunInfo | null>();
        setup.useCases.getStepRun.mockReturnValueOnce(older.promise);
        setup.useCases.getStepRun.mockResolvedValueOnce(
            createStepRunInfo({ ...FAILED_RUN, taskId: "task-2", status: "done", iterations: 1, reason: null })
        );

        const first = setup.presenter.openStepRun("step-1", "task-1");
        await setup.presenter.openStepRun("step-1", "task-2");
        older.resolve(createStepRunInfo({ ...FAILED_RUN, taskId: "task-1", status: "aborted" }));
        await first;

        const { stepRun } = setup.presenter.vm;
        expect(stepRun.rows[0]).toEqual({ label: "Status", value: "Done" });
        expect(stepRun.rows.map(row => row.label)).not.toContain("Reason");
    });

    it("discards a load that finishes after the panel was closed", async () => {
        const setup = await createLoaded();
        const info = createDeferred<ReviewStepRunInfo | null>();
        setup.useCases.getStepRun.mockReturnValue(info.promise);
        const pending = setup.presenter.openStepRun("step-1", "task-1");

        setup.presenter.closeStepRun();
        info.resolve(createStepRunInfo(FAILED_RUN));
        await pending;

        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("closes the panel on dispose and on a second init", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        await setup.presenter.openStepRun("step-1", "task-1");
        expect(setup.presenter.vm.stepRun.open).toBe(true);

        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);

        await setup.presenter.openStepRun("step-1", "task-1");
        setup.presenter.dispose();
        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("does nothing before the drawer was initialised", async () => {
        const setup = createSetup();

        await setup.presenter.openStepRun("step-1", "task-1");

        expect(setup.useCases.getStepRun).not.toHaveBeenCalled();
        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("keeps the panel open while the drawer refreshes", async () => {
        const setup = await createLoaded();
        setup.useCases.getStepRun.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        await setup.presenter.openStepRun("step-1", "task-1");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.stepRun.open).toBe(true);
    });
});
```

(The new describe uses the `createDeferred` helper Task 14 added at the top of this file.)

Modify `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`. Replace

```tsx
const renderDrawer = (useCases = createUseCases(), onClose = vi.fn()) => {
    renderWithContainer(
        <ReviewDetailsDrawer
            useCases={useCases}
            reviewId={"review-1"}
            reviewsUrl={null}
            onClose={onClose}
        />,
        createContainer()
    );
    return { useCases, onClose };
};
```

with

```tsx
const renderDrawer = (
    useCases = createUseCases(),
    onClose = vi.fn(),
    permissions: IPermission[] = []
) => {
    renderWithContainer(
        <ReviewDetailsDrawer
            useCases={useCases}
            reviewId={"review-1"}
            reviewsUrl={null}
            onClose={onClose}
        />,
        createContainer(permissions)
    );
    return { useCases, onClose };
};
```

Add the imports after `import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";` (`at` is already imported by Task 14 in this file):

```tsx
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { createStepRunInfo } from "~/review/testing/reviewFixtures.js";
```

Append at the end of the file:

```tsx
describe("ReviewDetailsDrawer, background task panel (R257, R258, R264)", () => {
    const OPERATOR: IPermission[] = [{ name: "workflows", editor: true }];

    // A failed run on top of Task 8's builder defaults.
    const FAILED_RUN: Partial<ReviewStepRunInfo> = {
        status: "failed",
        startedOn: at(9, 0),
        finishedOn: at(9, 5),
        iterations: 3,
        outcome: "failed",
        reason: "Webhook returned 503"
    };

    const getPanel = async (): Promise<HTMLElement> => {
        await waitFor(() =>
            expect(document.querySelector("[data-role='step-run-panel']")).not.toBeNull()
        );
        return document.querySelector("[data-role='step-run-panel']") as HTMLElement;
    };

    it("shows a Background task link per attempt to an operator", async () => {
        renderDrawer(createAiUseCases(), vi.fn(), OPERATOR);

        await screen.findByText("Attempts");

        expect(screen.getAllByText("Background task")).toHaveLength(2);
    });

    it("shows the link to a viewer with only the reassign permission", async () => {
        renderDrawer(createAiUseCases(), vi.fn(), [{ name: "workflows", reassign: true }]);

        await screen.findByText("Attempts");

        expect(screen.getAllByText("Background task")).toHaveLength(2);
    });

    it("hides the link from a viewer who is not an operator", async () => {
        renderDrawer(createAiUseCases());

        await screen.findByText("Attempts");

        expect(screen.queryByText("Background task")).toBeNull();
    });

    it("shows no link for an attempt without a task id", async () => {
        renderDrawer(createAiUseCases({ taskId: null }), vi.fn(), OPERATOR);

        await screen.findByText("Attempts");

        expect(screen.getAllByText("Background task")).toHaveLength(1);
    });

    it("opens the panel with the task of the attempt that was clicked", async () => {
        const useCases = createAiUseCases();
        useCases.getStepRun.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        renderDrawer(useCases, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[0]);

        const panel = await getPanel();
        expect(useCases.getStepRun).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "s1",
            taskId: "task-1"
        });
        await within(panel).findByText("Iterations");
        expect(within(panel).getByText("Status")).toBeTruthy();
        expect(within(panel).getByText("Failed")).toBeTruthy();
        expect(within(panel).getByText("Started")).toBeTruthy();
        expect(within(panel).getByText("Finished")).toBeTruthy();
        expect(within(panel).getByText("3")).toBeTruthy();
        expect(within(panel).getByText("Reason")).toBeTruthy();
        expect(within(panel).getByText("Webhook returned 503")).toBeTruthy();
        expect(document.body.textContent).not.toContain("task-1");
    });

    it("opens the current attempt's task from the last row", async () => {
        const useCases = createAiUseCases();
        useCases.getStepRun.mockResolvedValue(createStepRunInfo({ ...FAILED_RUN, taskId: "task-2", status: "done" }));
        renderDrawer(useCases, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[1]);

        await getPanel();
        expect(useCases.getStepRun).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "s1",
            taskId: "task-2"
        });
    });

    it("says the task is no longer available when it is gone", async () => {
        const useCases = createAiUseCases();
        useCases.getStepRun.mockResolvedValue(null);
        renderDrawer(useCases, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[0]);

        expect(await screen.findByText("This task is no longer available.")).toBeTruthy();
    });

    it("shows the error text when the load fails", async () => {
        const useCases = createAiUseCases();
        useCases.getStepRun.mockRejectedValue(new Error("Network."));
        renderDrawer(useCases, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");

        fireEvent.click(screen.getAllByText("Background task")[0]);

        const panel = await getPanel();
        expect(
            await within(panel).findByText("The server did not respond. Try again in a moment.")
        ).toBeTruthy();
    });

    it("closes the panel with Escape and keeps the drawer open", async () => {
        const useCases = createAiUseCases();
        useCases.getStepRun.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        renderDrawer(useCases, vi.fn(), OPERATOR);
        await screen.findByText("Attempts");
        fireEvent.click(screen.getAllByText("Background task")[0]);
        await getPanel();

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() =>
            expect(document.querySelector("[data-role='step-run-panel']")).toBeNull()
        );
        expect(screen.getByText("Attempts")).toBeTruthy();
    });
});
```

(`createAiUseCases` is Task 14's helper at the end of this file; the stepOverrides `{ taskId: null }` removes the current attempt's task id.)

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/getStepRunPanel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -40
```

Expected: `getStepRunPanel.test.ts` fails with `Failed to resolve import` for `getStepRunPanel.js`. `buildReviewDetailsViewModel.test.ts` fails (`stepRun` is `undefined`). `ReviewDetailsPresenter.test.ts` fails (`setup.presenter.openStepRun is not a function`, `vm.stepRun` is `undefined`). `ReviewDetailsDrawer.test.tsx` fails (no `Background task` link). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/presentation/reviewDetails/getStepRunPanel.ts`:

```ts
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewStepRunPanelRowVm } from "./abstractions.js";
import type { ReviewStepRunPanelVm } from "./abstractions.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";

export const STEP_RUN_PANEL_TITLE = "Background task";
export const STEP_RUN_GONE_TEXT = "This task is no longer available.";

export interface StepRunPanelInput {
    open: boolean;
    loading: boolean;
    error: string | null;
    info: ReviewStepRunInfo | null;
}

const getStatusLabel = (status: string): string => {
    switch (status) {
        case "pending":
            return "Pending";
        case "running":
            return "Running";
        case "done":
            return "Done";
        case "failed":
            return "Failed";
        case "aborted":
            return "Aborted";
        default:
            return status;
    }
};

// A row without a value is left out: there is no copy for an empty value (R264).
const getRows = (info: ReviewStepRunInfo): ReviewStepRunPanelRowVm[] => {
    const rows: ReviewStepRunPanelRowVm[] = [
        { label: "Status", value: getStatusLabel(info.status) }
    ];

    if (info.startedOn !== null) {
        const started = formatReviewTimeFull(info.startedOn);
        if (started !== "") {
            rows.push({ label: "Started", value: started });
        }
    }
    if (info.finishedOn !== null) {
        const finished = formatReviewTimeFull(info.finishedOn);
        if (finished !== "") {
            rows.push({ label: "Finished", value: finished });
        }
    }
    rows.push({ label: "Iterations", value: String(info.iterations) });
    if (info.reason !== null && info.reason.trim() !== "") {
        rows.push({ label: "Reason", value: info.reason.trim() });
    }
    return rows;
};

/*
 * The render-ready task panel (R264): closed, loading, an error, "gone" (the task record no longer
 * exists, the use case returned `null`) or the rows of the task. The task id, the outcome, the
 * input, output and logs are never part of it (R146). Pure.
 */
export const getStepRunPanel = (input: StepRunPanelInput): ReviewStepRunPanelVm => {
    if (!input.open) {
        return { open: false, loading: false, error: null, gone: false, rows: [] };
    }
    if (input.loading) {
        return { open: true, loading: true, error: null, gone: false, rows: [] };
    }
    if (input.error !== null) {
        return { open: true, loading: false, error: input.error, gone: false, rows: [] };
    }
    if (input.info === null) {
        return { open: true, loading: false, error: null, gone: true, rows: [] };
    }
    return { open: true, loading: false, error: null, gone: false, rows: getRows(input.info) };
};
```

Modify `abstractions.ts` of the drawer. Add before `export type ReviewDetailsStatus = ...`:

```ts
export interface ReviewStepRunPanelRowVm {
    label: string;
    value: string;
}

// The task panel of the drawer (R264): render-ready values only.
export interface ReviewStepRunPanelVm {
    open: boolean;
    loading: boolean;
    error: string | null;
    // The task record no longer exists.
    gone: boolean;
    rows: ReviewStepRunPanelRowVm[];
}

```

In `IReviewDetailsViewModel` replace

```ts
    openAction: TargetReviewOpenAction | null;
    reviewId: string | null;
}
```

with

```ts
    openAction: TargetReviewOpenAction | null;
    reviewId: string | null;
    stepRun: ReviewStepRunPanelVm;
}
```

and in `IReviewDetailsPresenter` replace

```ts
    closeAction(): void;
    actionDone(): Promise<void>;
    dispose(): void;
}
```

with

```ts
    closeAction(): void;
    openStepRun(stepId: string, taskId: string): Promise<void>;
    closeStepRun(): void;
    actionDone(): Promise<void>;
    dispose(): void;
}
```

Modify `buildReviewDetailsViewModel.ts`. Add `import type { ReviewStepRunPanelVm } from "./abstractions.js";` after `import type { ReviewDetailsStepVm } from "./abstractions.js";`, add to `ReviewDetailsViewModelInput` after `canViewStepRun: boolean;`:

```ts
    stepRun: ReviewStepRunPanelVm;
```

and change the destructuring to

```ts
    const { status, review: withFlags, error, openAction, canViewStepRun, stepRun, now } = input;
```

Replace the three returns. The not-loaded one

```ts
            cancelledText: null,
            actions: [],
            error,
            openAction,
            reviewId: null
        };
```

with

```ts
            cancelledText: null,
            actions: [],
            error,
            openAction,
            reviewId: null,
            stepRun
        };
```

the cancelled one

```ts
            cancelledText: getCancelledText(review, now),
            actions: [],
            error: null,
            openAction,
            reviewId: review.id
        };
```

with

```ts
            cancelledText: getCancelledText(review, now),
            actions: [],
            error: null,
            openAction,
            reviewId: review.id,
            stepRun
        };
```

and the loaded one

```ts
            canRequest: false
        }),
        error: null,
        openAction,
        reviewId: review.id
    };
```

with

```ts
            canRequest: false
        }),
        error: null,
        openAction,
        reviewId: review.id,
        stepRun
    };
```

Modify `ReviewDetailsPresenter.ts` (the version Task 14 wrote). Add imports after `import type { ReviewWithFlags } from "~/review/domain/types.js";`:

```ts
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
```

and after `import { buildReviewDetailsViewModel } from "./buildReviewDetailsViewModel.js";`:

```ts
import { getStepRunPanel } from "./getStepRunPanel.js";
```

Add the state fields after `private unsubscribe: (() => void) | null = null;`:

```ts
    private stepRunOpen = false;
    private stepRunLoading = false;
    private stepRunError: string | null = null;
    private stepRunInfo: ReviewStepRunInfo | null = null;
    // A newer open, a close and a dispose supersede a task load in flight.
    private stepRunToken = 0;
```

In the constructor replace

```ts
            | "unsubscribe"
            | "params"
            | "review"
        >(this, {
            activity: false,
            identityContext: false,
            token: false,
            inFlight: false,
            refreshQueued: false,
            notifying: false,
            unsubscribe: false,
            params: observableRef,
            review: observableRef
        });
```

with

```ts
            | "unsubscribe"
            | "stepRunToken"
            | "stepRunInfo"
            | "params"
            | "review"
        >(this, {
            activity: false,
            identityContext: false,
            token: false,
            inFlight: false,
            refreshQueued: false,
            notifying: false,
            unsubscribe: false,
            stepRunToken: false,
            stepRunInfo: observableRef,
            params: observableRef,
            review: observableRef
        });
```

In `get vm()` replace

```ts
        const permissions = getWorkflowsPermissionSet(identity);
        return buildReviewDetailsViewModel({
            status: this.status,
            review: this.review,
            error: this.error,
            openAction: this.action,
            canViewStepRun: permissions.editor || permissions.reassign,
            now: new Date()
        });
```

with

```ts
        const permissions = getWorkflowsPermissionSet(identity);
        const stepRun = getStepRunPanel({
            open: this.stepRunOpen,
            loading: this.stepRunLoading,
            error: this.stepRunError,
            info: this.stepRunInfo
        });
        return buildReviewDetailsViewModel({
            status: this.status,
            review: this.review,
            error: this.error,
            openAction: this.action,
            canViewStepRun: permissions.editor || permissions.reassign,
            stepRun,
            now: new Date()
        });
```

Add after `closeAction(): void { ... }`:

```ts
    async openStepRun(stepId: string, taskId: string): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const token = this.beginStepRun();

        try {
            const info = await params.useCases.getStepRun({
                reviewId: params.reviewId,
                stepId,
                taskId
            });
            if (token !== this.stepRunToken) {
                return;
            }
            this.applyStepRun(info);
        } catch (error) {
            if (token !== this.stepRunToken) {
                return;
            }
            this.applyStepRunFailure(error);
        }
    }

    closeStepRun(): void {
        this.stepRunToken += 1;
        this.resetStepRun();
    }
```

In `dispose()` and in `begin(params)` add, after the `this.action = null;` line of each:

```ts
        this.stepRunToken += 1;
        this.resetStepRun();
```

and add the private methods after `applyFailure`:

```ts
    private beginStepRun(): number {
        this.stepRunToken += 1;
        this.stepRunOpen = true;
        this.stepRunLoading = true;
        this.stepRunError = null;
        this.stepRunInfo = null;
        return this.stepRunToken;
    }

    private applyStepRun(info: ReviewStepRunInfo | null): void {
        this.stepRunLoading = false;
        this.stepRunError = null;
        this.stepRunInfo = info;
    }

    private applyStepRunFailure(error: unknown): void {
        this.stepRunLoading = false;
        this.stepRunInfo = null;
        const errorKind = classifyReviewActionError(error);
        this.stepRunError = getActionErrorMessage(errorKind, error, LOAD_FAILED_MESSAGE);
    }

    private resetStepRun(): void {
        this.stepRunOpen = false;
        this.stepRunLoading = false;
        this.stepRunError = null;
        this.stepRunInfo = null;
    }
```

Create `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewStepRunPanel.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ReviewDetailsPresenter } from "../abstractions.js";
import { STEP_RUN_GONE_TEXT } from "../getStepRunPanel.js";
import { STEP_RUN_PANEL_TITLE } from "../getStepRunPanel.js";

export interface ReviewStepRunPanelProps {
    presenter: ReviewDetailsPresenter.Interface;
}

/*
 * The background task of an attempt (R257, R264): status, times, iterations and the fixed reason,
 * or "This task is no longer available." A modal over the drawer, closed with Close or Escape;
 * everything it shows comes from the presenter's `vm.stepRun`.
 */
export const ReviewStepRunPanel = createReactiveComponent(function ReviewStepRunPanel(
    props: ReviewStepRunPanelProps
) {
    const { presenter } = props;
    const panel = presenter.vm.stepRun;

    if (!panel.open) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.closeStepRun();
                }
            }}
            title={STEP_RUN_PANEL_TITLE}
            loading={panel.loading}
            actions={<Dialog.CancelAction text={"Close"} />}
        >
            <div data-role={"step-run-panel"} className={"flex flex-col gap-md"}>
                {panel.error !== null && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {panel.error}
                    </Alert>
                )}
                {panel.gone && <Text size={"md"}>{STEP_RUN_GONE_TEXT}</Text>}
                {panel.rows.length > 0 && (
                    <div className={"grid grid-cols-[120px_1fr] gap-x-md gap-y-xs text-sm"}>
                        {panel.rows.map(row => (
                            <React.Fragment key={row.label}>
                                <span className={"text-neutral-muted"}>{row.label}</span>
                                <span>{row.value}</span>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </Dialog>
    );
});
```

Modify `components/ReviewDetailsDrawer.tsx`. Add the icon import after `import { Text } from "@webiny/admin-ui";` (the file has no other `@webiny/icons` import; the `.svg` import is the pattern of `reviewBarAppearance.ts`):

```tsx
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
```

and the panel import after `import type { ReviewDetailsPresenter } from "../abstractions.js";`:

```tsx
import { ReviewStepRunPanel } from "./ReviewStepRunPanel.js";
```

Replace the attempts rows (Task 14)

```tsx
                                    {step.attempts.map(attempt => (
                                        <div
                                            key={attempt.number}
                                            className={"flex flex-wrap items-center gap-sm"}
                                        >
                                            <span>{attempt.text}</span>
                                        </div>
                                    ))}
```

with

```tsx
                                    {step.attempts.map(attempt => {
                                        const taskId = attempt.taskId;
                                        return (
                                            <div
                                                key={attempt.number}
                                                className={"flex flex-wrap items-center gap-sm"}
                                            >
                                                <span>{attempt.text}</span>
                                                {attempt.showTaskLink && taskId !== null && (
                                                    <Button
                                                        variant={"ghost"}
                                                        size={"sm"}
                                                        text={"Background task"}
                                                        icon={<OpenInNewIcon />}
                                                        onClick={() =>
                                                            presenter.openStepRun(
                                                                step.stepId,
                                                                taskId
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
```

and mount the panel: replace

```tsx
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
        </>
    );
});
```

with

```tsx
                onDone={() => presenter.actionDone()}
                onClose={() => presenter.closeAction()}
            />
            <ReviewStepRunPanel presenter={presenter} />
        </>
    );
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails/getStepRunPanel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -40
```

Expected: PASS. Component test notes to check on the first run: while the panel `Dialog` is open Radix marks the drawer `aria-hidden`, so the tests query the panel through its `data-role` element and `within(...)`, not through `getByRole("dialog")`; `within(panel).getByText("Failed")` is scoped because the drawer also has a `Failed` step tag. If `fireEvent.keyDown(document, ...)` does not reach Radix's Escape handler, fire it on `document.activeElement ?? document.body`. If the `Background task` button text matches both the button and an inner span, use `getAllByRole("button", { name: "Background task" })` instead of `getAllByText`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewDetails packages/app-workflows/src/review/presentation/reviewList packages/app-workflows/src/review/editor packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. A test that builds an `IReviewDetailsViewModel` literal or implements `IReviewDetailsPresenter` by hand fails to compile on `stepRun`, `openStepRun`, `closeStepRun`; the drawer tests and `buildReviewDetailsViewModel.test.ts` are the only ones, and both are updated above.

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
git commit -m "feat(app-workflows): open the background task of an attempt in a panel" -m "Operators see a Background task link on each attempt of an AI or automation step. It opens a panel that loads the step run through getStepRun and shows its status, start and end time, iterations and the fixed reason, or says the task is no longer available. A newer open wins over an older load, and closing the panel or the drawer discards a load in flight." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The panel is a modal `Dialog`**, not a drawer or an inline block: the contract names `ReviewStepRunPanel.tsx` and a `ReviewStepRunPanelVm` with `open`, and a second drawer over the drawer would stack two side panels. A dialog over the drawer is the pattern the action dialogs already use.
- **Empty rows are left out** (`Started`, `Finished`, `Reason` without a value), because neither R264 nor Q37 has a copy for an empty value. `Status` and `Iterations` always show. The info's `outcome` is not shown (R264 lists five rows only).
- **Gone and heading texts** are exported constants of `getStepRunPanel.ts` (`STEP_RUN_GONE_TEXT`, `STEP_RUN_PANEL_TITLE`), because the contract's `ReviewStepRunPanelVm` carries `gone: boolean` and no text; the component reads the constants.
- **The `Background task` link** is rendered here, not in Task 14: it needs `openStepRun`, which this task adds. Task 14 only prepares `showTaskLink`.
- **`ReviewErrorCode.StepRunNotFound`** is Task 8's addition; the presenter test uses it for a "not on the step" rejection and expects the server's message (the generic branch of `getActionErrorMessage`).
- **Existing tests changed:** `buildReviewDetailsViewModel.test.ts` (the `build` helper and the two literal calls gain `stepRun`), `ReviewDetailsDrawer.test.tsx` (`renderDrawer` gains a permissions parameter).
- Size: medium (one pure file, one component, presenter and abstraction changes, four test files).
