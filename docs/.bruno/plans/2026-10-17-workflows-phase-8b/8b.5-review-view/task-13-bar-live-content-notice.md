### Task 13: Bar live refresh and the content notice

R210, R234, R260, R262; D60, D163; Q35; design README 6 ("Content updated by {step}" notice), `research-spec.md` 4c (content-updated notice, QBZ-56); Review Focus 5, 6. `TargetReviewPresenter` subscribes to the activity bus (R260) and refreshes once per signal of its own review or revision, queues one more refresh for signals during a load, and ignores the signal of its own `actionDone`. After a refresh in which an AI or automation step that was running is not `inReview` any more, it calls the app's `IReviewContentReloader` once for that step and, when the reloaded revision differs, shows the content notice (`vm.contentNotice`) until the viewer's next action. `ReviewBar` renders the notice inside its card. The reloader itself is built by the apps (Tasks 17, 18); this task defines its interface and proves the presenter with fakes.

- **Subscription (R260):**
  - `init(params)` first drops the previous subscription (a later `init` is the presenter's `begin`), then subscribes with `activity.subscribe([params.target.namespace], listener)` and loads. `dispose` drops it.
  - The listener refreshes when `signal.reviewId` equals the loaded review's id or `signal.targetRevisionId` equals the presenter's target revision. Another review's or revision's signal is ignored.
  - A signal delivered while the presenter is inside its own `activity.notify` call (a per-instance `notifying` flag around the synchronous `notify` of `actionDone`) is ignored, so the own action refreshes once (no websocket frame follows for the viewer's own action, R254).
  - A signal while a load is in flight, also the first load of `init`, sets one queued flag; when that load settles, exactly one more refresh runs. A direct `refresh()` (the bar's conflict path) still supersedes an older load through the load token. A failed load drops the queued flag (no retry storm).
- **Content reload (R262, D163):**
  - Detection is a pure function `getFinishedAutomatedStep(previous, next)` in `getFinishedAutomatedStep.ts`: the step of `previous` that `isStepRunning` (Task 11) and that is, in `next`, present and not `inReview`. The first load (`previous` null) and a load that fails never reload.
  - The presenter calls `params.contentReloader.reload()` once per such step, after the new state is applied and published. `true` sets the notice, `false` or a throw sets none. The reloader **never re-initialises the presenter**: the presenter's `status` stays `active` while it runs (tested).
  - The notice: text `Content updated by {step title}. The editor loaded the latest version.`, icon `auto_awesome` for an `ai` owner, `bolt` for `automation`. It stays until the viewer's next action (`openAction` or `actionDone`) or `dispose`.
- **View:** `ReviewBar` renders `vm.contentNotice` as the design's success-subtle strip (README 6) with its icon as the last row of the bar card (`role="status"`); both app editors mount the shared bar, so the notice is written once. The contract names `EditorReviewBar`; the strip must sit inside the card, which `EditorReviewBar` does not own, so `ReviewBar` reads `vm.contentNotice` (the view model is already its input, no new prop).
- **`TargetReviewInitParams.contentReloader: IReviewContentReloader | null`** is a required field. To keep every package compiling, this task adds `contentReloader: null` to the two app init-params builders (`getCmsEntryReviewInitParams.ts`, `PageReviewBar.tsx`); Tasks 17 and 18 replace the `null` with the real reloader.

**Files:**
- Create: `packages/app-workflows/src/review/content/IReviewContentReloader.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getFinishedAutomatedStep.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/getContentNotice.ts`
- Create: `packages/app-workflows/src/review/testing/fakeReviewActivity.ts`
- Create: `packages/app-workflows/src/review/presentation/targetReview/liveRefreshPure.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.tsx`
- Modify: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`
- Modify: `packages/app-workflows/src/review/testing/targetReviewFakes.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts`
- Modify: `packages/app-workflows/src/review/editor/EditorReviewSession.test.ts`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx`

**Interfaces:**
- Consumes: Task 10 (`ReviewActivitySignal { namespace; source; reviewId: string | null; targetRevisionId: string | null }`, `ReviewActivity.Interface.subscribe(namespaces, listener): () => void`), Task 11 (`isStepRunning`), Task 12 (`createViewModel` already carries the new bar fields), 8a (`TargetReviewPresenter`, `createFakeUseCases`, `createReview`, `createReviewWithFlags`, `createStep`, `createActor`, `TARGET`, `renderWithContainer`). Task 12 (`at`, `createRunningAiStep`, `createRunningAutomationStep` from `~/review/testing/`). Existing (verified): admin-ui `Icon`, `Text`.
- Produces: `IReviewContentReloader { reload(): Promise<boolean> }` (Tasks 17, 18 implement it), `TargetReviewInitParams.contentReloader`, `ReviewContentNoticeVm { text: string; icon: ReviewContentNoticeIcon }` and `ReviewContentNoticeIcon = "bolt" | "auto_awesome"`, `ITargetReviewViewModel.contentNotice: ReviewContentNoticeVm | null`, `getFinishedAutomatedStep`, `getContentNotice`, `createFakeActivity` (`FakeReviewActivity`, reused by Task 14), `REVIEW_NOTICE_ICONS`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/testing/fakeReviewActivity.ts` (a vitest fake that delivers synchronously to its subscribers, like the real bus, so the own-signal rule is testable):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ReviewActivity } from "~/review/activity/abstractions.js";

interface FakeSubscription {
    namespaces: string[];
    listener: ReviewActivity.Listener;
}

export interface FakeReviewActivity extends ReviewActivity.Interface {
    subscribe: Mock<ReviewActivity.Interface["subscribe"]>;
    notify: Mock<ReviewActivity.Interface["notify"]>;
    // How many subscriptions are active right now.
    listenerCount(): number;
}

/*
 * A bus that records its calls and, like the real one, delivers a signal synchronously to the
 * listeners of its namespace; `subscribe` returns a working unsubscribe.
 */
export const createFakeActivity = (): FakeReviewActivity => {
    const subscriptions = new Set<FakeSubscription>();

    const subscribe = vi.fn((namespaces: string[], listener: ReviewActivity.Listener) => {
        const subscription: FakeSubscription = { namespaces, listener };
        subscriptions.add(subscription);
        return () => {
            subscriptions.delete(subscription);
        };
    });

    const notify = vi.fn((signal: ReviewActivity.Signal) => {
        for (const subscription of [...subscriptions]) {
            if (subscription.namespaces.includes(signal.namespace)) {
                subscription.listener(signal);
            }
        }
    });

    return { subscribe, notify, listenerCount: () => subscriptions.size };
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/liveRefreshPure.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getFinishedAutomatedStep } from "./getFinishedAutomatedStep.js";
import { getContentNotice } from "./getContentNotice.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

describe("getFinishedAutomatedStep (R262)", () => {
    it("returns the running step that is approved in the next load", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });
        const next = createReview({ steps: [createRunningAiStep({ state: StepState.Approved })] });

        expect(getFinishedAutomatedStep(previous, next)?.id).toBe("step-1");
    });

    it("also returns a step that failed or was rejected", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });

        [StepState.Failed, StepState.Rejected].forEach(state => {
            const next = createReview({ steps: [createRunningAiStep({ state })] });
            expect(getFinishedAutomatedStep(previous, next)?.id).toBe("step-1");
        });
    });

    it("is null while the step is still running", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });
        const next = createReview({ steps: [createRunningAiStep()] });

        expect(getFinishedAutomatedStep(previous, next)).toBeNull();
    });

    it("is null without a previous load (the first load never reloads)", () => {
        const next = createReview({ steps: [createRunningAiStep({ state: StepState.Approved })] });

        expect(getFinishedAutomatedStep(null, next)).toBeNull();
    });

    it("is null when the next load has no review or no such step", () => {
        const previous = createReview({ steps: [createRunningAiStep()] });
        const other = createReview({ steps: [createRunningAiStep({ id: "step-9" })] });

        expect(getFinishedAutomatedStep(previous, null)).toBeNull();
        expect(getFinishedAutomatedStep(previous, other)).toBeNull();
    });

    it("is null for a step a person reviews", () => {
        const person = (state: StepStateValue) => {
            return createStep({ id: "step-1", state, owner: LUKA });
        };
        const previous = createReview({ steps: [person(StepState.InReview)] });
        const next = createReview({ steps: [person(StepState.Approved)] });

        expect(getFinishedAutomatedStep(previous, next)).toBeNull();
    });

    it("is null for a step that was not running before", () => {
        const previous = createReview({
            steps: [createRunningAiStep({ state: StepState.Awaiting, owner: null })]
        });
        const next = createReview({ steps: [createRunningAiStep({ state: StepState.Approved })] });

        expect(getFinishedAutomatedStep(previous, next)).toBeNull();
    });
});

describe("getContentNotice (R262)", () => {
    it("names the step and uses auto_awesome for an AI step", () => {
        expect(getContentNotice(createRunningAiStep())).toEqual({
            text: "Content updated by AI tone check. The editor loaded the latest version.",
            icon: "auto_awesome"
        });
    });

    it("uses bolt for an automation step", () => {
        const step = createRunningAutomationStep();

        expect(getContentNotice(step)).toEqual({
            text: "Content updated by Notify web team. The editor loaded the latest version.",
            icon: "bolt"
        });
    });
});
```

Modify `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts`. Add the imports after `import { ReviewActivity } from "~/review/activity/abstractions.js";`:

```ts
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createStep } from "~/review/testing/createStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import type { IReviewContentReloader } from "~/review/content/IReviewContentReloader.js";
```

(`StepState`, `StepStateValue`, `createActor`, `createStep`, `createRunningAiStep`, `createRunningAutomationStep`, `createFakeActivity` and `IReviewContentReloader` are the new lines.) In `createParams` replace

```ts
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        ...overrides
    };
};
```

with

```ts
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        contentReloader: null,
        ...overrides
    };
};
```

In `createSetup` replace `const activity = { subscribe: vi.fn(), notify: vi.fn() };` with

```ts
    const activity = createFakeActivity();
```

Append at the end of the file:

```ts
describe("TargetReviewPresenter live refresh (R260)", () => {
    const flush = async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 0));
    };

    const signalFor = (overrides = {}): ReviewActivity.Signal => {
        return {
            namespace: TARGET.namespace,
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId,
            ...overrides
        };
    };

    let setup: ReturnType<typeof createSetup>;
    let useCases: FakeReviewUseCases;

    beforeEach(async () => {
        setup = createSetup();
        useCases = createFakeUseCases();
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams(useCases));
    });

    it("subscribes to the namespace of its target on init", () => {
        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.subscribe.mock.calls[0][0]).toEqual([TARGET.namespace]);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("refreshes once for a signal of its own review", async () => {
        expect(useCases.getTargetReview).toHaveBeenCalledTimes(1);

        setup.activity.notify(signalFor({ targetRevisionId: null }));
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(2));
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(2);
    });

    it("refreshes once for a signal of its own revision, also without a review", async () => {
        setup = createSetup();
        useCases = createFakeUseCases();
        await setup.presenter.init(createParams(useCases));
        expect(setup.presenter.vm.status).toBe("none");

        setup.activity.notify(signalFor({ reviewId: null }));
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(2));
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(2);
    });

    it("ignores a signal of another review and another revision", async () => {
        setup.activity.notify(
            signalFor({ reviewId: "review-9", targetRevisionId: "entry-9#0001" })
        );
        setup.activity.notify(signalFor({ reviewId: null, targetRevisionId: null }));
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(1);
    });

    it("ignores a signal of another namespace", async () => {
        setup.activity.notify(signalFor({ namespace: "wb.page" }));
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(1);
    });

    it("queues exactly one more refresh for the signals that arrive during a load", async () => {
        const next = createDeferred<ReviewWithFlags | null>();
        useCases.getTargetReview.mockReturnValueOnce(next.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(2));

        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        expect(useCases.getTargetReview).toHaveBeenCalledTimes(2);

        next.resolve(createReviewWithFlags());
        await pending;
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(3);
    });

    it("queues a signal that arrives during the first load of init", async () => {
        setup = createSetup();
        useCases = createFakeUseCases();
        const first = createDeferred<ReviewWithFlags | null>();
        useCases.getTargetReview.mockReturnValueOnce(first.promise);
        const pending = setup.presenter.init(createParams(useCases));
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(1));

        setup.activity.notify(signalFor());
        first.resolve(createReviewWithFlags());
        await pending;
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(2);
    });

    it("drops the queued refresh when the load fails", async () => {
        let fail: (error: Error) => void = () => undefined;
        useCases.getTargetReview.mockReturnValueOnce(
            new Promise<ReviewWithFlags | null>((_, reject) => {
                fail = reject;
            })
        );
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(2));
        setup.activity.notify(signalFor());

        fail(new Error("Network."));
        await pending;
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(2);
        expect(setup.presenter.vm.status).toBe("failed");
    });

    it("refreshes once for its own actionDone: its own signal is ignored", async () => {
        setup.presenter.openAction("approve", "step-1");

        await setup.presenter.actionDone();
        await flush();

        expect(useCases.getTargetReview).toHaveBeenCalledTimes(2);
        expect(setup.activity.notify).toHaveBeenCalledTimes(1);
    });

    it("sends the review id and the revision with its own action signal", async () => {
        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("reacts to a signal again after its own action", async () => {
        await setup.presenter.actionDone();
        await flush();
        const afterAction = useCases.getTargetReview.mock.calls.length;

        setup.activity.notify(signalFor());
        await vi.waitFor(() =>
            expect(useCases.getTargetReview).toHaveBeenCalledTimes(afterAction + 1)
        );
    });

    it("drops the previous subscription on a second init", async () => {
        await setup.presenter.init(createParams(useCases));

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(2);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("drops the subscription on dispose and ignores later signals", async () => {
        setup.presenter.dispose();

        expect(setup.activity.listenerCount()).toBe(0);
        setup.activity.notify(signalFor());
        await flush();
        expect(useCases.getTargetReview).toHaveBeenCalledTimes(1);
    });
});

describe("TargetReviewPresenter content reload (R262)", () => {
    const NOTICE_TEXT = "Content updated by AI tone check. The editor loaded the latest version.";

    const runningReview = () => {
        return createReviewWithFlags(
            createReview({
                currentStepId: "step-1",
                currentStepState: StepState.InReview,
                steps: [createRunningAiStep({ state: StepState.InReview })]
            })
        );
    };

    const finishedReview = () => {
        return createReviewWithFlags(
            createReview({
                currentStepId: "step-2",
                currentStepState: StepState.Awaiting,
                steps: [
                    createRunningAiStep({ state: StepState.Approved }),
                    createStep({ id: "step-2", title: "Legal sign-off", state: StepState.Awaiting })
                ]
            })
        );
    };

    const createReloader = (result: boolean | Error = true) => {
        const reload = vi.fn<IReviewContentReloader["reload"]>();
        if (result instanceof Error) {
            reload.mockRejectedValue(result);
        } else {
            reload.mockResolvedValue(result);
        }
        const reloader: IReviewContentReloader = { reload };
        return { reload, reloader };
    };

    let setup: ReturnType<typeof createSetup>;
    let useCases: FakeReviewUseCases;

    beforeEach(() => {
        setup = createSetup();
        useCases = createFakeUseCases();
    });

    const initRunning = async (reloader: IReviewContentReloader | null) => {
        useCases.getTargetReview.mockResolvedValue(runningReview());
        await setup.presenter.init(createParams(useCases, { contentReloader: reloader }));
    };

    it("reloads once after a running AI step finished and shows the notice with auto_awesome", async () => {
        const { reload, reloader } = createReloader(true);
        await initRunning(reloader);
        expect(reload).not.toHaveBeenCalled();
        expect(setup.presenter.vm.contentNotice).toBeNull();

        useCases.getTargetReview.mockResolvedValue(finishedReview());
        await setup.presenter.refresh();

        expect(reload).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.contentNotice).toEqual({
            text: NOTICE_TEXT,
            icon: "auto_awesome"
        });
    });

    it("reloads only once for the same finished step", async () => {
        const { reload, reloader } = createReloader(true);
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();
        await setup.presenter.refresh();

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it("uses bolt for an automation step", async () => {
        const { reloader } = createReloader(true);
        useCases.getTargetReview.mockResolvedValue(
            createReviewWithFlags(createReview({ steps: [createRunningAutomationStep({ state: StepState.InReview })] }))
        );
        await setup.presenter.init(createParams(useCases, { contentReloader: reloader }));

        useCases.getTargetReview.mockResolvedValue(
            createReviewWithFlags(createReview({ steps: [createRunningAutomationStep({ state: StepState.Approved })] }))
        );
        await setup.presenter.refresh();

        expect(setup.presenter.vm.contentNotice).toEqual({
            text: "Content updated by Notify web team. The editor loaded the latest version.",
            icon: "bolt"
        });
    });

    it("sets no notice when the reloader reports no change", async () => {
        const { reload, reloader } = createReloader(false);
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(reload).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("sets no notice and keeps the loaded review when the reloader throws", async () => {
        const { reload, reloader } = createReloader(new Error("Reload failed."));
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(reload).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.contentNotice).toBeNull();
        expect(setup.presenter.vm.status).toBe("active");
        expect(setup.presenter.vm.reviewId).toBe("review-1");
    });

    it("never re-initialises the presenter while it reloads", async () => {
        const seen: string[] = [];
        const reload = vi.fn(async () => {
            seen.push(setup.presenter.vm.status);
            return true;
        });
        await initRunning({ reload });
        const subscriptions = setup.activity.subscribe.mock.calls.length;
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(seen).toEqual(["active"]);
        expect(setup.activity.subscribe).toHaveBeenCalledTimes(subscriptions);
        expect(useCases.getBoundWorkflow).toHaveBeenCalledTimes(2);
    });

    it("does not reload on the first load, even for a finished step", async () => {
        const { reload, reloader } = createReloader(true);
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        await setup.presenter.init(createParams(useCases, { contentReloader: reloader }));

        expect(reload).not.toHaveBeenCalled();
        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("does not reload when a person finished their step", async () => {
        const { reload, reloader } = createReloader(true);
        const person = (state: StepStateValue) => {
            return createStep({
                id: "step-1",
                state,
                owner: createActor({ id: "user-2", displayName: "Luka Perić" })
            });
        };
        useCases.getTargetReview.mockResolvedValue(
            createReviewWithFlags(createReview({ steps: [person(StepState.InReview)] }))
        );
        await setup.presenter.init(createParams(useCases, { contentReloader: reloader }));

        useCases.getTargetReview.mockResolvedValue(
            createReviewWithFlags(createReview({ steps: [person(StepState.Approved)] }))
        );
        await setup.presenter.refresh();

        expect(reload).not.toHaveBeenCalled();
    });

    it("does nothing without a reloader", async () => {
        await initRunning(null);
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(setup.presenter.vm.contentNotice).toBeNull();
        expect(setup.presenter.vm.status).toBe("active");
    });

    it("reloads when a live signal brings the finished step", async () => {
        const { reload, reloader } = createReloader(true);
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());

        setup.activity.notify({
            namespace: TARGET.namespace,
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });

        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
        await vi.waitFor(() => expect(setup.presenter.vm.contentNotice).not.toBeNull());
    });

    it("keeps the notice until the viewer's next action", async () => {
        const { reloader } = createReloader(true);
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());
        await setup.presenter.refresh();
        expect(setup.presenter.vm.contentNotice).not.toBeNull();

        await setup.presenter.refresh();
        expect(setup.presenter.vm.contentNotice).not.toBeNull();

        setup.presenter.openAction("approve", "step-2");
        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("clears the notice when an action is done", async () => {
        const { reloader } = createReloader(true);
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());
        await setup.presenter.refresh();
        expect(setup.presenter.vm.contentNotice).not.toBeNull();

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("clears the notice on dispose", async () => {
        const { reloader } = createReloader(true);
        await initRunning(reloader);
        useCases.getTargetReview.mockResolvedValue(finishedReview());
        await setup.presenter.refresh();

        setup.presenter.dispose();

        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("sets no notice when the presenter was disposed while the reloader ran", async () => {
        let release: (value: boolean) => void = () => undefined;
        const reload = vi.fn(
            () =>
                new Promise<boolean>(resolve => {
                    release = resolve;
                })
        );
        await initRunning({ reload });
        useCases.getTargetReview.mockResolvedValue(finishedReview());
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

        setup.presenter.dispose();
        release(true);
        await pending;

        expect(setup.presenter.vm.contentNotice).toBeNull();
    });
});
```

Append to `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts` (it already defines `input`):

```ts
describe("buildTargetReviewViewModel, content notice (R262)", () => {
    it("carries the notice it is given and defaults to none", () => {
        const notice = {
            text: "Content updated by AI tone check. The editor loaded the latest version.",
            icon: "auto_awesome" as const
        };

        const withNotice = buildTargetReviewViewModel(
            input({ status: "active", review: createReviewWithFlags(), contentNotice: notice })
        );
        const without = buildTargetReviewViewModel(input({ status: "none" }));

        expect(withNotice.contentNotice).toEqual(notice);
        expect(without.contentNotice).toBeNull();
    });
});
```

and in the same file add `contentNotice: null,` to the `input` builder (after `openAction: null,`):

```ts
        busy: false,
        openAction: null,
        contentNotice: null,
        ...overrides
```

Modify `packages/app-workflows/src/review/editor/EditorReviewSession.test.ts`: in `createContainer` replace

```ts
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
```

with

```ts
    container.registerInstance(ReviewActivity, createFakeActivity());
```

add `import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";` after `import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";`, and add `contentReloader: null` to the three `init` calls: after each `isUnpublished: false` that closes an `init({ ... })` object (the CMS one, the WB one and the dispose test's one) add a comma and the line `contentReloader: null`, e.g.

```ts
            canRequest: true,
            isPublished: false,
            isUnpublished: false,
            contentReloader: null
        });
```

Append to `packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx` (it already imports `screen`, `renderBar` and `createViewModel`):

```tsx
describe("ReviewBar, content notice (R262)", () => {
    const AI_TEXT = "Content updated by AI tone check. The editor loaded the latest version.";
    const AUTOMATION_TEXT =
        "Content updated by Notify web team. The editor loaded the latest version.";

    it("shows the notice as a strip inside the bar card with its icon", () => {
        const { container } = renderBar(
            createViewModel({ contentNotice: { text: AI_TEXT, icon: "auto_awesome" } })
        );

        const bar = container.querySelector("[data-role='review-bar']") as HTMLElement;
        const notice = bar.querySelector("[data-role='content-notice']") as HTMLElement;
        expect(notice).not.toBeNull();
        expect(notice.getAttribute("role")).toBe("status");
        expect(notice.textContent).toContain(AI_TEXT);
        expect(notice.className).toContain("bg-success-subtle");
        expect(notice.querySelector("[data-testid='svg-icon']")).not.toBeNull();
    });

    it("shows the notice of an automation step with its own text", () => {
        renderBar(createViewModel({ contentNotice: { text: AUTOMATION_TEXT, icon: "bolt" } }));

        expect(screen.getByText(AUTOMATION_TEXT)).toBeTruthy();
    });

    it("shows no notice without one", () => {
        const { container } = renderBar(createViewModel());

        expect(container.querySelector("[data-role='content-notice']")).toBeNull();
        expect(screen.queryByText(/Content updated by/)).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/liveRefreshPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30
```

Expected: `liveRefreshPure.test.ts` fails with `Failed to resolve import` for `getFinishedAutomatedStep.js` and `getContentNotice.js`. `TargetReviewPresenter.test.ts` fails on `fakeReviewActivity.js`'s consumers: the live refresh cases fail (no subscription, `subscribe` never called, no reload, `contentNotice` undefined). `buildTargetReviewViewModel.test.ts` fails (`contentNotice` is `undefined`). `ReviewBar.test.tsx` fails on the notice cases. `EditorReviewSession.test.ts` still passes (`contentReloader` is an unknown extra field until the types change; vitest does not type-check). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/content/IReviewContentReloader.ts`:

```ts
/*
 * What an editor does to show the content again after an AI or automation step changed it while
 * the editor was locked (R262). Built by the apps (the CMS form, the WB page editor) and handed to
 * the review presenter through its init parameters. `reload` resolves `true` when the reloaded
 * revision differs from the loaded one; it never re-initialises the review presenter.
 */
export interface IReviewContentReloader {
    reload(): Promise<boolean>;
}
```

Create `packages/app-workflows/src/review/presentation/targetReview/getFinishedAutomatedStep.ts`:

```ts
import type { Review } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { isStepRunning } from "./isStepRunning.js";

/*
 * The step that was running (an AI or automation owner, `inReview`) in the previous load and is
 * present in the next load but not `inReview` any more: it finished, failed or was rejected, so
 * the content may have changed (R262). Returns the step as it was in the previous load, or `null`.
 * The first load has no previous review. Pure.
 */
export const getFinishedAutomatedStep = (
    previous: Review | null,
    next: Review | null
): ReviewStep | null => {
    if (previous === null || next === null) {
        return null;
    }

    for (const step of previous.steps) {
        if (!isStepRunning(step)) {
            continue;
        }
        const current = next.steps.find(candidate => candidate.id === step.id);
        if (current !== undefined && current.state !== StepState.InReview) {
            return step;
        }
    }
    return null;
};
```

Create `packages/app-workflows/src/review/presentation/targetReview/getContentNotice.ts`:

```ts
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewContentNoticeVm } from "./abstractions.js";

/*
 * The "Content updated by {step}" notice (R262, QBZ-56): `auto_awesome` for an AI owner, `bolt`
 * for an automation. Pure.
 */
export const getContentNotice = (step: ReviewStep): ReviewContentNoticeVm => {
    const text = `Content updated by ${step.title}. The editor loaded the latest version.`;
    if (step.owner !== null && step.owner.type === "ai") {
        return { text, icon: "auto_awesome" };
    }
    return { text, icon: "bolt" };
};
```

Modify `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts`. Add the import after `import type { ReviewTarget } from "~/review/domain/types.js";`:

```ts
import type { IReviewContentReloader } from "~/review/content/IReviewContentReloader.js";
```

Add before `export interface TargetReviewOpenAction {`:

```ts
// The icon of the "Content updated by {step}" notice: AI `auto_awesome`, automation `bolt` (R262).
export type ReviewContentNoticeIcon = "bolt" | "auto_awesome";

export interface ReviewContentNoticeVm {
    text: string;
    icon: ReviewContentNoticeIcon;
}

```

In `ITargetReviewViewModel` replace

```ts
    openAction: TargetReviewOpenAction | null;
    busy: boolean;
}
```

with

```ts
    openAction: TargetReviewOpenAction | null;
    busy: boolean;
    // Set after an AI or automation step changed the locked content and the editor reloaded it.
    contentNotice: ReviewContentNoticeVm | null;
}
```

and replace

```ts
export interface TargetReviewInitParams extends TargetReviewContext {
    useCases: IReviewUseCases;
    target: ReviewTarget;
}
```

with

```ts
export interface TargetReviewInitParams extends TargetReviewContext {
    useCases: IReviewUseCases;
    target: ReviewTarget;
    // How the editor reloads the content after an automated step changed it (R262); `null` for none.
    contentReloader: IReviewContentReloader | null;
}
```

Modify `buildTargetReviewViewModel.ts`: add the import `import type { ReviewContentNoticeVm } from "./abstractions.js";` after `import type { TargetReviewFailureKind } from "./abstractions.js";`, add to `TargetReviewViewModelInput` after `openAction: TargetReviewOpenAction | null;`:

```ts
    contentNotice: ReviewContentNoticeVm | null;
```

and to the returned object after `busy: input.busy`:

```ts
        busy: input.busy,
        contentNotice: input.contentNotice
```

Modify `packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.ts` (the file as Task 10 leaves it: `actionDone` already passes `reviewId` and `targetRevisionId` and keeps the `reviewBefore` fallback for a cancel; these hunks keep that).

Imports: after `import { TargetReviewPresenter as Abstraction } from "./abstractions.js";` add

```ts
import type { ReviewContentNoticeVm } from "./abstractions.js";
```

and after `import { buildTargetReviewViewModel } from "./buildTargetReviewViewModel.js";` add

```ts
import { getContentNotice } from "./getContentNotice.js";
import { getFinishedAutomatedStep } from "./getFinishedAutomatedStep.js";
```

State: replace

```ts
    private action: TargetReviewOpenAction | null = null;
    private loadToken = 0;

    constructor(
```

with

```ts
    private action: TargetReviewOpenAction | null = null;
    private contentNotice: ReviewContentNoticeVm | null = null;
    private loadToken = 0;
    // Bumped by `init` and `dispose`: a reload that settles after either must not set the notice.
    private generation = 0;
    // A load is on the wire, including the publish and reload that finish it (R260).
    private inFlight = false;
    // True while the presenter is inside its own `activity.notify` call (R260).
    private notifying = false;
    // A signal arrived during a load: one more refresh runs when that load settles (R260).
    private refreshQueued = false;
    private unsubscribe: (() => void) | null = null;

    constructor(
```

Replace the observable map

```ts
        makeAutoObservable<
            TargetReviewPresenterImpl,
            "eventPublisher" | "activity" | "identityContext" | "loadToken" | "params" | "review"
        >(this, {
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
            params: observableRef,
            review: observableRef
        });
```

with

```ts
        makeAutoObservable<
            TargetReviewPresenterImpl,
            | "eventPublisher"
            | "activity"
            | "identityContext"
            | "loadToken"
            | "generation"
            | "inFlight"
            | "notifying"
            | "refreshQueued"
            | "unsubscribe"
            | "params"
            | "review"
            | "contentNotice"
        >(this, {
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
            generation: false,
            inFlight: false,
            notifying: false,
            refreshQueued: false,
            unsubscribe: false,
            params: observableRef,
            review: observableRef,
            contentNotice: observableRef
        });
```

View model and `init`: replace

```ts
            busy: this.busy,
            openAction: this.action
        });
    }

    async init(params: TargetReviewInitParams): Promise<void> {
        this.begin(params);
        await this.refresh();
    }
```

with

```ts
            busy: this.busy,
            openAction: this.action,
            contentNotice: this.contentNotice
        });
    }

    async init(params: TargetReviewInitParams): Promise<void> {
        this.begin(params);
        this.unsubscribe = this.activity.subscribe([params.target.namespace], signal => {
            this.handleSignal(signal);
        });
        await this.refresh();
    }
```

`refresh`: replace

```ts
        const token = this.startLoad();
        let review: ReviewWithFlags | null = null;
```

with

```ts
        const generation = this.generation;
        const token = this.startLoad();
        let review: ReviewWithFlags | null = null;
```

replace

```ts
            this.applyFailure(error);
            return;
        }

        this.applyLoaded(hasWorkflow, review);
```

with

```ts
            this.applyFailure(error);
            return;
        }

        const previous = this.review;
        this.applyLoaded(hasWorkflow, review);
```

and replace

```ts
        } catch {
            // A failing cache writer must not break the bar; the state above is already applied.
        }
    }
```

with

```ts
        } catch {
            // A failing cache writer must not break the bar; the state above is already applied.
        }

        const finished = getFinishedAutomatedStep(
            previous ? previous.review : null,
            current ? current.review : null
        );
        if (finished !== null && params.contentReloader !== null) {
            let changed = false;
            try {
                changed = await params.contentReloader.reload();
            } catch {
                // A failing reload shows no notice; the review state above is already applied.
            }
            if (changed && generation === this.generation) {
                const notice = getContentNotice(finished);
                this.setContentNotice(notice);
            }
        }

        if (token === this.loadToken) {
            this.inFlight = false;
            if (this.refreshQueued) {
                this.refreshQueued = false;
                await this.refresh();
            }
        }
    }
```

`actionDone` (Task 10's version): replace

```ts
        const reviewBefore = this.review;

        this.closeAction();
        await this.refresh();
```

with

```ts
        const reviewBefore = this.review;

        this.contentNotice = null;
        this.closeAction();
        await this.refresh();
```

and replace

```ts
        this.activity.notify({
            namespace: params.target.namespace,
            source: "own",
            reviewId,
            targetRevisionId: params.target.targetRevisionId
        });
    }
```

with

```ts
        this.notifying = true;
        try {
            this.activity.notify({
                namespace: params.target.namespace,
                source: "own",
                reviewId,
                targetRevisionId: params.target.targetRevisionId
            });
        } finally {
            this.notifying = false;
        }
    }
```

`openAction`: replace

```ts
    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.action = { kind, stepId };
    }
```

with

```ts
    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.contentNotice = null;
        this.action = { kind, stepId };
    }
```

`dispose`, `begin` and `startLoad`: replace the three methods

```ts
    dispose(): void {
        this.loadToken += 1;
        this.params = null;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
    }

    private begin(params: TargetReviewInitParams): void {
        this.loadToken += 1;
        this.params = params;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
    }

    private startLoad(): number {
        this.loadToken += 1;
        this.busy = true;
        return this.loadToken;
    }
```

with

```ts
    dispose(): void {
        this.loadToken += 1;
        this.generation += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = null;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
        this.contentNotice = null;
    }

    private begin(params: TargetReviewInitParams): void {
        this.loadToken += 1;
        this.generation += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = params;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
        this.contentNotice = null;
    }

    private dropSubscription(): void {
        if (this.unsubscribe !== null) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /*
     * A signal of this presenter's review or revision refreshes it once (R260). Its own signal is
     * ignored (the own action refreshes itself), and a signal during a load queues one more
     * refresh instead of starting a parallel one.
     */
    private handleSignal(signal: ReviewActivity.Signal): void {
        const params = this.params;
        if (!params || this.notifying) {
            return;
        }

        const sameReview = this.review !== null && signal.reviewId === this.review.review.id;
        const sameRevision = signal.targetRevisionId === params.target.targetRevisionId;
        if (!sameReview && !sameRevision) {
            return;
        }

        if (this.inFlight) {
            this.refreshQueued = true;
            return;
        }
        void this.refresh();
    }

    private setContentNotice(notice: ReviewContentNoticeVm): void {
        this.contentNotice = notice;
    }

    private startLoad(): number {
        this.loadToken += 1;
        this.busy = true;
        this.inFlight = true;
        return this.loadToken;
    }
```

`applyFailure`: replace

```ts
    private applyFailure(error: unknown): void {
        this.busy = false;
        this.review = null;
```

with

```ts
    private applyFailure(error: unknown): void {
        this.busy = false;
        this.inFlight = false;
        this.refreshQueued = false;
        this.review = null;
```

Modify `components/reviewBarAppearance.ts`. After `import { ReactComponent as ProgressActivityIcon } from "@webiny/icons/progress_activity.svg";` (Task 12) add:

```ts
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
```

add `import type { ReviewContentNoticeIcon } from "../abstractions.js";` after the `TargetReviewTagIcon` import, and add after the `REVIEW_TAG_ICONS` constant:

```ts
// The icon of the "Content updated by {step}" notice (R262).
export const REVIEW_NOTICE_ICONS: Record<ReviewContentNoticeIcon, SvgComponent> = {
    bolt: BoltIcon,
    auto_awesome: AutoAwesomeIcon
};
```

Modify `components/ReviewBar.tsx`. Add `import { REVIEW_NOTICE_ICONS } from "./reviewBarAppearance.js";` after `import { REVIEW_ACTION_ICONS } from "./reviewBarAppearance.js";`. After `const target = { namespace: vm.namespace, targetRevisionId: vm.targetRevisionId };` add

```tsx
    let notice: React.ReactElement | null = null;
    if (vm.contentNotice !== null) {
        const NoticeIcon = REVIEW_NOTICE_ICONS[vm.contentNotice.icon];
        notice = (
            <div
                data-role={"content-notice"}
                role={"status"}
                className={"flex items-center gap-sm rounded-md bg-success-subtle p-sm"}
            >
                <Icon icon={<NoticeIcon />} label={""} size={"sm"} />
                <Text size={"sm"}>{vm.contentNotice.text}</Text>
            </div>
        );
    }
```

and replace

```tsx
                    </div>
                )}
            </div>
            {vm.openAction !== null && vm.openAction.kind === "request" && (
```

with

```tsx
                    </div>
                )}
                {notice}
            </div>
            {vm.openAction !== null && vm.openAction.kind === "request" && (
```

Modify `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`: replace

```ts
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id }
    };
```

with

```ts
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        // Task 17 replaces this with the CMS content reloader.
        contentReloader: null
    };
```

Modify `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`: replace

```tsx
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            ...context
        });
```

with

```tsx
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            // Task 18 replaces this with the WB page content reloader.
            contentReloader: null,
            ...context
        });
```

The existing tests of those two packages that assert the exact init parameters are exactly three (a grep of `targetRevisionId` in the test files of both packages finds no other exact-object `init` expectation); each gains `contentReloader: null`. Tasks 17 and 18 change these lines again, so the hunks are exact.

Modify `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`, the exact-object expectation in `it("... loadRevision ...")` (the line `target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },` followed by `targetTitle: "Article: Hello",` occurs once). Before:

```ts
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            targetTitle: "Article: Hello",
```

After:

```ts
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            contentReloader: null,
            targetTitle: "Article: Hello",
```

Modify `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx`, both exact-object expectations (the draft case and the published case; replace both occurrences). Before:

```ts
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
```

After:

```ts
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            contentReloader: null,
            targetTitle: "Home",
```

Modify `packages/app-workflows/src/review/testing/targetReviewFakes.ts`: after `busy: false,` in `createViewModel` add `contentNotice: null,`:

```ts
        openAction: null,
        busy: false,
        contentNotice: null,
        ...overrides
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/liveRefreshPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -40
```

Expected: PASS. Notes to check on the first run: the existing `actionDone` test (`refreshes, closes the action and notifies the activity bus on actionDone`) asserts the notify payload; Task 10 gave it the two new signal fields. That test loads `createReviewWithFlags()` before `actionDone`, so the payload must be `reviewId: "review-1"` and `targetRevisionId: TARGET.targetRevisionId`; if Task 10 wrote another value there, change the expectation to that (a revision without a review sends `reviewId: null`). In the content reload tests the presenter reads `getBoundWorkflow` once per load, so "never re-initialises" counts two calls (the init load and the one refresh).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview packages/app-workflows/src/review/editor packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in the three packages.

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): refresh the review bar live and show the content notice" -m "The target review presenter subscribes to the activity bus and refreshes once per signal of its own review or revision, queues one refresh for signals during a load and ignores the signal of its own action. When a running AI or automation step finished, it asks the app's content reloader to reload the revision and shows 'Content updated by {step}' when it changed. the bar renders the notice." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`contentReloader` is required**, as the contract says; the task adds `contentReloader: null` to the CMS and WB init-params builders so every package compiles, and Tasks 17 and 18 replace the `null` (their before-hunks include that line).
- **Notice component:** the success-subtle strip of design README 6 is rendered inside the card by `ReviewBar` (from `vm.contentNotice`), not by `EditorReviewBar` as the contract's file list says, because `EditorReviewBar` mounts the bar as a sibling and cannot put anything inside its card without a new prop. The contract's Interfaces entry should read `ReviewBar.tsx` and `ReviewBar.test.tsx`.
- **Both `openAction` and `actionDone` clear the notice** ("until the viewer's next action"); `refresh` and `setContext` keep it. A second finished step replaces it.
- **Queue rule:** a dedicated `inFlight` flag (set in `startLoad`, cleared after the publish and reload tail, in `begin`, `dispose` and `applyFailure`), the same rule as the drawer; the queued refresh is drained only by the load that is still current. A failed load drops the queued flag and, since it clears the loaded review, the next success has no previous review, so a reload or notice for a step that finished meanwhile is skipped (accepted).
- **Shared fake `createFakeActivity`** (`testing/fakeReviewActivity.ts`, vitest, a separate file from the pure builders per R243) is new; Task 14 reuses it.
- **Presenter changes are hunks** against the file as Task 10 leaves it; `actionDone` keeps Task 10's `reviewBefore` fallback.
- Size: large (three small source files, one fake, presenter hunks, the bar strip, six modified test files).
