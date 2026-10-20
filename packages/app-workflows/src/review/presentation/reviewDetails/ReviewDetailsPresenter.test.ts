import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewDetailsPresenterFeature } from "./feature.js";
import type { ReviewDetailsInitParams } from "./abstractions.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import type { FakeReviewActivity } from "~/review/testing/fakeReviewActivity.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { createStepRunInfo } from "~/review/testing/reviewFixtures.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import { at } from "~/review/testing/at.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { StepState } from "~/review/domain/StepState.js";

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    let reject: (error: Error) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

interface Setup extends ReviewUseCaseFakes {
    presenter: ReturnType<typeof ReviewDetailsPresenterFeature.resolve>["presenter"];
    activity: FakeReviewActivity;
    onClose: ReturnType<typeof vi.fn>;
    onChanged: ReturnType<typeof vi.fn>;
    params: () => ReviewDetailsInitParams;
}

const createSetup = (permissions: IPermission[] = []): Setup => {
    const container = new Container();
    const activity = createFakeActivity();
    const identityContext = createWorkflowsIdentityContext({ permissions });
    const fakes = createReviewUseCaseFakes();
    const review = createReview();
    const flags = createFlags({ canStart: true });
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, identityContext);
    ReviewDetailsPresenterFeature.register(container);
    const { presenter } = ReviewDetailsPresenterFeature.resolve(container);
    const onClose = vi.fn();
    const onChanged = vi.fn();
    return {
        ...fakes,
        presenter,
        activity,
        onClose,
        onChanged,
        params: () => ({
            namespace: "cms.article",
            reviewId: "review-1",
            reviewsUrl: "/cms/content-reviews",
            onClose,
            onChanged
        })
    };
};

describe("ReviewDetailsPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the review by id and is loading before that", async () => {
        const pending = setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("loading");

        await pending;

        expect(setup.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1"
        });
        expect(setup.presenter.vm.status).toBe("loaded");
        expect(setup.presenter.vm.header?.title).toBe("Spring campaign");
        expect(setup.presenter.vm.actions.map(action => action.kind)).toEqual(["start"]);
    });

    it("fails with the design text when the load rejects", async () => {
        setup.getReview.execute.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.error).toBe("The server did not respond. Try again in a moment.");
    });

    it("fails with the server message of a rejection that is not classified", async () => {
        setup.getReview.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "This content is locked by another review.",
                code: ReviewErrorCode.TargetLocked
            })
        );

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.error).toBe("This content is locked by another review.");
    });

    it("fails with the no-access text for a read that is not authorized (QBZ-59)", async () => {
        setup.getReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.error).toBe(NO_ACCESS_MESSAGE);
    });

    it("retries with refresh while keeping the loaded view during a reload", async () => {
        await setup.presenter.init(setup.params());
        let release: (value: ReturnType<typeof createReviewWithFlags>) => void = () => undefined;
        setup.getReview.execute.mockReturnValue(
            new Promise(resolve => {
                release = resolve;
            })
        );

        const pending = setup.presenter.refresh();
        expect(setup.presenter.vm.status).toBe("loaded");

        release(createReviewWithFlags(createReview({ title: "Renamed" }), createFlags()));
        await pending;
        expect(setup.presenter.vm.header?.title).toBe("Renamed");
    });

    it("recovers from a failed load with refresh", async () => {
        setup.getReview.execute.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("failed");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.status).toBe("loaded");
    });

    it("opens and closes an action", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.openAction("start", "step-1");
        expect(setup.presenter.vm.openAction).toEqual({ kind: "start", stepId: "step-1" });

        setup.presenter.closeAction();
        expect(setup.presenter.vm.openAction).toBeNull();
    });

    it("refreshes and signals the activity bus after an action", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.openAction("start", "step-1");

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.openAction).toBeNull();
        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
        expect(setup.onChanged).not.toHaveBeenCalled();
    });

    it("signals the activity bus even when the refresh after an action fails", async () => {
        await setup.presenter.init(setup.params());
        setup.getReview.execute.mockRejectedValue(new Error("Network."));

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
        expect(setup.onChanged).not.toHaveBeenCalled();
    });

    it("ignores a late response after dispose and resets", async () => {
        let release: (value: ReturnType<typeof createReviewWithFlags>) => void = () => undefined;
        setup.getReview.execute.mockReturnValue(
            new Promise(resolve => {
                release = resolve;
            })
        );
        const pending = setup.presenter.init(setup.params());

        setup.presenter.dispose();
        release(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.header).toBeNull();
    });

    it("is transient", () => {
        const container = new Container();
        const fakes = createReviewUseCaseFakes();
        registerReviewUseCaseFakes(container, fakes);
        container.registerInstance(ReviewActivity, createFakeActivity());
        container.registerInstance(IdentityContext, createWorkflowsIdentityContext());
        ReviewDetailsPresenterFeature.register(container);
        const first = ReviewDetailsPresenterFeature.resolve(container).presenter;
        const second = ReviewDetailsPresenterFeature.resolve(container).presenter;
        expect(first).not.toBe(second);
    });
});

describe("ReviewDetailsPresenter live refresh (R260)", () => {
    const flush = async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 0));
    };

    const signalFor = (overrides = {}): ReviewActivity.Signal => {
        return {
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001",
            ...overrides
        };
    };

    it("subscribes with the namespace of the loaded review, after the first load", async () => {
        const setup = createSetup();
        const first = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.getReview.execute.mockReturnValue(first.promise);

        const pending = setup.presenter.init(setup.params());
        expect(setup.activity.listenerCount()).toBe(0);
        first.resolve(createReviewWithFlags(createReview(), createFlags()));
        await pending;

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.subscribe.mock.calls[0][0]).toEqual(["cms.article"]);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("subscribes with the loaded review's namespace, not the init namespace, after the first load (R357)", async () => {
        const setup = createSetup();
        const first = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.getReview.execute.mockReturnValue(first.promise);
        const params = { ...setup.params(), namespace: "cms.other" };

        const pending = setup.presenter.init(params);
        expect(setup.activity.subscribe).not.toHaveBeenCalled();
        const review = createReview();
        const flags = createFlags();
        const loaded = createReviewWithFlags(review, flags);
        first.resolve(loaded);
        await pending;

        expect(setup.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.other",
            reviewId: "review-1"
        });
        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.subscribe.mock.calls[0][0]).toEqual(["cms.article"]);
    });

    it("does not subscribe after a failed first load and subscribes once a retry succeeds", async () => {
        const setup = createSetup();
        setup.getReview.execute.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        expect(setup.activity.listenerCount()).toBe(0);

        await setup.presenter.refresh();
        await setup.presenter.refresh();

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("refreshes once for a signal of its own review", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        expect(setup.getReview.execute).toHaveBeenCalledTimes(1);

        setup.activity.notify(signalFor());
        await vi.waitFor(() => expect(setup.getReview.execute).toHaveBeenCalledTimes(2));
        await flush();

        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
    });

    it("ignores a signal of another review and of another namespace", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());

        setup.activity.notify(signalFor({ reviewId: "review-9" }));
        setup.activity.notify(signalFor({ reviewId: null }));
        setup.activity.notify(signalFor({ namespace: "wb.page" }));
        await flush();

        expect(setup.getReview.execute).toHaveBeenCalledTimes(1);
    });

    it("queues exactly one more refresh for the signals that arrive during a load", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        const next = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.getReview.execute.mockReturnValueOnce(next.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.getReview.execute).toHaveBeenCalledTimes(2));

        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);

        next.resolve(createReviewWithFlags(createReview(), createFlags()));
        await pending;
        await flush();

        expect(setup.getReview.execute).toHaveBeenCalledTimes(3);
    });

    it("drops the queued refresh when the load fails", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        const next = createDeferred<ReturnType<typeof createReviewWithFlags>>();
        setup.getReview.execute.mockReturnValueOnce(next.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.getReview.execute).toHaveBeenCalledTimes(2));
        setup.activity.notify(signalFor());

        next.reject(new Error("Network."));
        await pending;
        await flush();

        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
        expect(setup.presenter.vm.status).toBe("failed");
    });

    it("refreshes once for its own actionDone: its own signal is ignored", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());

        await setup.presenter.actionDone();
        await flush();

        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
    });

    it("reacts to a signal again after its own action", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        await setup.presenter.actionDone();
        await flush();
        const afterAction = setup.getReview.execute.mock.calls.length;

        setup.activity.notify(signalFor());

        await vi.waitFor(() =>
            expect(setup.getReview.execute).toHaveBeenCalledTimes(afterAction + 1)
        );
    });

    it("drops the previous subscription on a second init and on dispose", async () => {
        const setup = createSetup();
        await setup.presenter.init(setup.params());
        await setup.presenter.init(setup.params());

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(2);
        expect(setup.activity.listenerCount()).toBe(1);

        setup.presenter.dispose();
        expect(setup.activity.listenerCount()).toBe(0);
        setup.activity.notify(signalFor());
        await flush();
        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
    });
});

describe("ReviewDetailsPresenter task link (R258, R259)", () => {
    const failedAiReview = () => {
        return createReviewWithFlags(
            createReview({
                steps: [
                    createRunningAiStep({
                        state: StepState.Failed,
                        finishedOn: at(14, 25),
                        taskId: "task-2"
                    })
                ]
            }),
            createFlags()
        );
    };

    const linkFor = async (permissions: IPermission[]): Promise<boolean> => {
        const setup = createSetup(permissions);
        setup.getReview.execute.mockResolvedValue(failedAiReview());
        await setup.presenter.init(setup.params());
        return setup.presenter.vm.steps[0].attempts[0].showTaskLink;
    };

    it("is shown to a viewer with the workflows editor permission", async () => {
        expect(await linkFor([{ name: "workflows", editor: true }])).toBe(true);
    });

    it("is shown to a viewer with the workflows reassign permission", async () => {
        expect(await linkFor([{ name: "workflows", reassign: true }])).toBe(true);
    });

    it("is shown to a viewer with workflows full access", async () => {
        expect(await linkFor([{ name: "workflows.*" }])).toBe(true);
    });

    it("is shown when one of several roles grants the permission", async () => {
        const permissions = [{ name: "workflows" }, { name: "workflows", reassign: true }];

        expect(await linkFor(permissions)).toBe(true);
    });

    it("is hidden from a viewer without either permission", async () => {
        expect(await linkFor([])).toBe(false);
        expect(await linkFor([{ name: "workflows" }])).toBe(false);
        expect(await linkFor([{ name: "cms.contentEntry", own: true }])).toBe(false);
    });
});

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
        setup.getStepRun.execute.mockReturnValue(info.promise);

        const pending = setup.presenter.openStepRun("step-1", "task-1");
        expect(setup.presenter.vm.stepRun.open).toBe(true);
        expect(setup.presenter.vm.stepRun.loading).toBe(true);
        info.resolve(createStepRunInfo(FAILED_RUN));
        await pending;

        expect(setup.getStepRun.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
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
        setup.getStepRun.execute.mockResolvedValue(null);

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
        setup.getStepRun.execute.mockRejectedValue(new Error("Network."));

        await setup.presenter.openStepRun("step-1", "task-1");

        expect(setup.presenter.vm.stepRun.error).toBe(
            "The server did not respond. Try again in a moment."
        );
        expect(setup.presenter.vm.stepRun.rows).toEqual([]);
        expect(setup.presenter.vm.stepRun.gone).toBe(false);
    });

    it("shows the no-access text for a read that is not authorized", async () => {
        const setup = await createLoaded();
        setup.getStepRun.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.openStepRun("step-1", "task-1");

        expect(setup.presenter.vm.stepRun.error).toBe(NO_ACCESS_MESSAGE);
    });

    it("shows the server message of a task that is not on the step", async () => {
        const setup = await createLoaded();
        setup.getStepRun.execute.mockRejectedValue(
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
        setup.getStepRun.execute.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        await setup.presenter.openStepRun("step-1", "task-1");

        setup.presenter.closeStepRun();

        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("lets a newer open win over an older load", async () => {
        const setup = await createLoaded();
        const older = createDeferred<ReviewStepRunInfo | null>();
        setup.getStepRun.execute.mockReturnValueOnce(older.promise);
        setup.getStepRun.execute.mockResolvedValueOnce(
            createStepRunInfo({
                ...FAILED_RUN,
                taskId: "task-2",
                status: "done",
                iterations: 1,
                reason: null
            })
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
        setup.getStepRun.execute.mockReturnValue(info.promise);
        const pending = setup.presenter.openStepRun("step-1", "task-1");

        setup.presenter.closeStepRun();
        info.resolve(createStepRunInfo(FAILED_RUN));
        await pending;

        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("closes the panel on dispose and on a second init", async () => {
        const setup = await createLoaded();
        setup.getStepRun.execute.mockResolvedValue(createStepRunInfo(FAILED_RUN));
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

        expect(setup.getStepRun.execute).not.toHaveBeenCalled();
        expect(setup.presenter.vm.stepRun).toEqual(CLOSED);
    });

    it("keeps the panel open while the drawer refreshes", async () => {
        const setup = await createLoaded();
        setup.getStepRun.execute.mockResolvedValue(createStepRunInfo(FAILED_RUN));
        await setup.presenter.openStepRun("step-1", "task-1");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.stepRun.open).toBe(true);
    });
});
