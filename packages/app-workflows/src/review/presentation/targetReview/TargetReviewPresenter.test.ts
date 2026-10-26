import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { createActor } from "~/review/testing/createActor.js";
import { createStep } from "~/review/testing/createStep.js";
import { createRunningAiStep } from "~/review/testing/createAutomatedStep.js";
import { createRunningAutomationStep } from "~/review/testing/createAutomatedStep.js";
import { createFakeActivity } from "~/review/testing/fakeReviewActivity.js";
import type { IReviewContentReloader } from "~/review/content/IReviewContentReloader.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { TargetReviewPresenterFeature } from "./feature.js";
import type { TargetReviewInitParams } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}

const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const createParams = (overrides: Partial<TargetReviewInitParams> = {}): TargetReviewInitParams => {
    return {
        target: TARGET,
        targetTitle: "Spring campaign",
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        contentReloader: null,
        ...overrides
    };
};

const createIdentityContext = (teams: ITeam[]): IdentityContext.Interface => {
    const identity = { teams } as unknown as Identity;
    return { getIdentity: () => identity, setIdentity: vi.fn(), clear: vi.fn() };
};

// One fake per injected use case (R355): the namespace has a workflow, the revision no review.
const createSetup = (teams: ITeam[] = []) => {
    const container = new Container();
    const publisher = { publish: vi.fn().mockResolvedValue(undefined) };
    const activity = createFakeActivity();
    const workflow = createWorkflow();
    const getBoundWorkflow = {
        execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>().mockResolvedValue(workflow)
    };
    const getTargetReview = {
        execute: vi.fn<GetTargetReviewUseCase.Interface["execute"]>().mockResolvedValue(null)
    };
    container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
    container.registerInstance(GetTargetReviewUseCase, getTargetReview);
    container.registerInstance(EventPublisher, publisher);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, createIdentityContext(teams));
    TargetReviewPresenterFeature.register(container);
    const { presenter } = TargetReviewPresenterFeature.resolve(container);
    return { container, presenter, publisher, activity, getBoundWorkflow, getTargetReview };
};

const publishedPayloads = (publisher: { publish: ReturnType<typeof vi.fn> }) => {
    return publisher.publish.mock.calls.map(call => (call[0] as ReviewChangedEvent).payload);
};

describe("TargetReviewPresenter", () => {
    let setup: ReturnType<typeof createSetup>;

    beforeEach(() => {
        setup = createSetup();
    });

    it("names the viewer's own teams in the pool message (QBZ-25, R247)", async () => {
        setup = createSetup([{ id: "t2", slug: "legal", name: "Legal" }]);
        const base = createReview();
        const review = createReview({
            steps: [
                {
                    ...base.steps[0],
                    candidateTeams: [
                        { id: "t1", name: "Marketing" },
                        { id: "t2", name: "Legal" }
                    ]
                }
            ]
        });
        setup.getTargetReview.execute.mockResolvedValue(createReviewWithFlags(review));

        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.message).toBe("Waiting in the Legal team pool");
    });

    it("starts in the loading status before init", () => {
        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.allowsEditing).toBe(false);
    });

    it("is loading while init waits for the workflow", async () => {
        const workflow = createDeferred<null>();
        setup.getBoundWorkflow.execute.mockReturnValue(workflow.promise);

        const pending = setup.presenter.init(createParams());

        expect(setup.presenter.vm.status).toBe("loading");
        workflow.resolve(null);
        await pending;
        expect(setup.presenter.vm.status).toBe("noWorkflow");
    });

    it("is noWorkflow when the namespace has no workflow and asks for no review", async () => {
        setup.getBoundWorkflow.execute.mockResolvedValue(null);

        await setup.presenter.init(createParams());

        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith({
            namespace: TARGET.namespace
        });
        expect(setup.getTargetReview.execute).not.toHaveBeenCalled();
        expect(setup.presenter.vm.status).toBe("noWorkflow");
        expect(setup.presenter.vm.allowsEditing).toBe(true);
        expect(setup.presenter.vm.allowsPublishing).toBe(true);
        expect(publishedPayloads(setup.publisher)).toEqual([
            {
                namespace: TARGET.namespace,
                targetId: "entry-1",
                targetRevisionId: TARGET.targetRevisionId,
                review: null
            }
        ]);
    });

    it("is none when the revision has no review and publishes review null", async () => {
        await setup.presenter.init(createParams());

        expect(setup.getTargetReview.execute).toHaveBeenCalledWith(TARGET);
        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.actions.map(action => action.kind)).toEqual(["request"]);
        expect(publishedPayloads(setup.publisher)[0].review).toBeNull();
    });

    it("hides the request action when the app passes canRequest false", async () => {
        await setup.presenter.init(createParams({ canRequest: false }));

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.actions).toEqual([]);
    });

    it("treats a cancelled review as none (D75)", async () => {
        const cancelled = createReviewWithFlags(
            createReview({ state: ReviewState.Cancelled, isActive: false })
        );
        setup.getTargetReview.execute.mockResolvedValue(cancelled);

        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.allowsEditing).toBe(true);
    });

    it("is active with actions from the server flags only", async () => {
        const flags = createFlags({ canStart: true, canReassign: true });
        setup.getTargetReview.execute.mockResolvedValue(
            createReviewWithFlags(createReview(), flags)
        );

        await setup.presenter.init(createParams());

        const { vm } = setup.presenter;
        expect(vm.status).toBe("active");
        expect(vm.reviewId).toBe("review-1");
        expect(vm.actions.map(action => action.kind)).toEqual(["reassign", "start"]);
        expect(vm.allowsEditing).toBe(false);
        const payload = publishedPayloads(setup.publisher)[0];
        expect(payload.review?.id).toBe("review-1");
        expect(payload.targetId).toBe("entry-1");
    });

    it("fails with noAccess when the read is not authorized (R225)", async () => {
        setup.getTargetReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("noAccess");
        expect(setup.presenter.vm.allowsEditing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("fails with error on any other error, also a transport error", async () => {
        setup.getTargetReview.execute.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("error");
        expect(setup.presenter.vm.allowsPublishing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("fails with error when reading the workflow fails", async () => {
        setup.getBoundWorkflow.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Other.", code: ReviewErrorCode.Validation })
        );

        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("error");
        expect(setup.presenter.vm.allowsPublishing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("recovers from a failed load with refresh", async () => {
        setup.getTargetReview.execute.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(createParams());
        expect(setup.presenter.vm.status).toBe("failed");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.status).toBe("none");
    });

    it("keeps the current view and reports busy while refresh loads", async () => {
        setup.getTargetReview.execute.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams());
        const next = createDeferred<ReviewWithFlags | null>();
        setup.getTargetReview.execute.mockReturnValue(next.promise);

        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2));

        expect(setup.presenter.vm.status).toBe("active");
        expect(setup.presenter.vm.busy).toBe(true);
        next.resolve(null);
        await pending;
        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.busy).toBe(false);
    });

    it("publishes an event after every settled load", async () => {
        await setup.presenter.init(createParams());
        await setup.presenter.refresh();

        expect(setup.publisher.publish).toHaveBeenCalledTimes(2);
        expect(setup.publisher.publish.mock.calls[0][0]).toBeInstanceOf(ReviewChangedEvent);
    });

    it("keeps its state when the event publisher rejects", async () => {
        setup.publisher.publish.mockRejectedValue(new Error("Cache writer failed."));

        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.status).toBe("none");
    });

    it("ignores the response of an old target after a second init (Review Focus 5)", async () => {
        const oldReview = createDeferred<ReviewWithFlags | null>();
        setup.getTargetReview.execute.mockReturnValueOnce(oldReview.promise);
        setup.getTargetReview.execute.mockResolvedValueOnce(null);
        const pending = setup.presenter.init(createParams());
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1));

        await setup.presenter.init(
            createParams({
                target: { namespace: TARGET.namespace, targetRevisionId: "entry-2#0001" }
            })
        );
        oldReview.resolve(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.publisher.publish).toHaveBeenCalledTimes(1);
        expect(publishedPayloads(setup.publisher)[0].targetRevisionId).toBe("entry-2#0001");
    });

    it("ignores a response that arrives after dispose", async () => {
        const late = createDeferred<ReviewWithFlags | null>();
        setup.getTargetReview.execute.mockReturnValue(late.promise);
        const pending = setup.presenter.init(createParams());
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalled());

        setup.presenter.dispose();
        late.resolve(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("keeps two presenters independent (Review Focus 1)", async () => {
        const other = createSetup();
        other.getBoundWorkflow.execute.mockResolvedValue(null);

        await setup.presenter.init(createParams());
        await other.presenter.init(createParams());

        expect(other.presenter).not.toBe(setup.presenter);
        expect(setup.presenter.vm.status).toBe("none");
        expect(other.presenter.vm.status).toBe("noWorkflow");
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledTimes(1);
        expect(other.getBoundWorkflow.execute).toHaveBeenCalledTimes(1);
    });

    it("opens and closes an action", async () => {
        await setup.presenter.init(createParams());

        setup.presenter.openAction("request", null);
        expect(setup.presenter.vm.openAction).toEqual({
            kind: "request",
            stepId: null,
            reviewId: null
        });

        setup.presenter.closeAction();
        expect(setup.presenter.vm.openAction).toBeNull();
    });

    it("refreshes, closes the action and notifies the activity bus on actionDone", async () => {
        await setup.presenter.init(createParams());
        setup.presenter.openAction("request", null);
        setup.getTargetReview.execute.mockResolvedValue(createReviewWithFlags());

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.openAction).toBeNull();
        expect(setup.presenter.vm.status).toBe("active");
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("signals the review id of the review it holds after a cancel left none (R260)", async () => {
        await setup.presenter.init(createParams());
        setup.getTargetReview.execute.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.refresh();
        setup.getTargetReview.execute.mockResolvedValue(null);

        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("signals a null review id when the target has no review before or after the action", async () => {
        setup.getTargetReview.execute.mockResolvedValue(null);
        await setup.presenter.init(createParams());

        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: null,
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("replaces the context without reloading", async () => {
        setup.getTargetReview.execute.mockResolvedValue(
            createReviewWithFlags(createReview({ state: ReviewState.Approved }))
        );
        await setup.presenter.init(createParams());
        expect(setup.presenter.vm.message).toBe("Approved, ready to publish");

        setup.presenter.setContext({
            targetTitle: "New title",
            canRequest: false,
            isPublished: false,
            isUnpublished: true
        });
        expect(setup.presenter.vm.message).toBe(
            "Approved and unpublished. Publishing again needs no new review."
        );
        expect(setup.presenter.vm.targetTitle).toBe("New title");

        setup.presenter.setContext({
            targetTitle: "New title",
            canRequest: false,
            isPublished: true,
            isUnpublished: false
        });
        expect(setup.presenter.vm.message).toBe("Approved and published");
        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1);
    });

    it("exposes the target it was initialised with (R-f)", async () => {
        await setup.presenter.init(createParams());

        expect(setup.presenter.vm.namespace).toBe(TARGET.namespace);
        expect(setup.presenter.vm.targetRevisionId).toBe(TARGET.targetRevisionId);
        expect(setup.presenter.vm.targetTitle).toBe("Spring campaign");
    });

    it("resets everything on dispose (R212)", async () => {
        setup.getTargetReview.execute.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams());
        setup.presenter.openAction("approve", "step-1");

        setup.presenter.dispose();

        const { vm } = setup.presenter;
        expect(vm.status).toBe("loading");
        expect(vm.reviewId).toBeNull();
        expect(vm.openAction).toBeNull();
        expect(vm.actions).toEqual([]);
        expect(vm.busy).toBe(false);
    });

    it("is transient: every resolve is a new instance (R212)", () => {
        const first = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        const second = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        expect(first).not.toBe(second);
    });

    it("reads the bound workflow and the target review through its two injected use cases (R352)", async () => {
        await setup.presenter.init(createParams());

        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith({
            namespace: TARGET.namespace
        });
        expect(setup.getTargetReview.execute).toHaveBeenCalledWith(TARGET);
    });
});

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

    beforeEach(async () => {
        setup = createSetup();
        setup.getTargetReview.execute.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams());
    });

    it("subscribes to the namespace of its target on init", () => {
        expect(setup.activity.subscribe).toHaveBeenCalledTimes(1);
        expect(setup.activity.subscribe.mock.calls[0][0]).toEqual([TARGET.namespace]);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("refreshes once for a signal of its own review", async () => {
        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1);

        setup.activity.notify(signalFor({ targetRevisionId: null }));
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2));
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2);
    });

    it("refreshes once for a signal of its own revision, also without a review", async () => {
        setup = createSetup();
        await setup.presenter.init(createParams());
        expect(setup.presenter.vm.status).toBe("none");

        setup.activity.notify(signalFor({ reviewId: null }));
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2));
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2);
    });

    it("ignores a signal of another review and another revision", async () => {
        setup.activity.notify(
            signalFor({ reviewId: "review-9", targetRevisionId: "entry-9#0001" })
        );
        setup.activity.notify(signalFor({ reviewId: null, targetRevisionId: null }));
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1);
    });

    it("ignores a signal of another namespace", async () => {
        setup.activity.notify(signalFor({ namespace: "wb.page" }));
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1);
    });

    it("queues exactly one more refresh for the signals that arrive during a load", async () => {
        const next = createDeferred<ReviewWithFlags | null>();
        setup.getTargetReview.execute.mockReturnValueOnce(next.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2));

        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        setup.activity.notify(signalFor());
        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2);

        next.resolve(createReviewWithFlags());
        await pending;
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(3);
    });

    it("queues a signal that arrives during the first load of init", async () => {
        setup = createSetup();
        const first = createDeferred<ReviewWithFlags | null>();
        setup.getTargetReview.execute.mockReturnValueOnce(first.promise);
        const pending = setup.presenter.init(createParams());
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1));

        setup.activity.notify(signalFor());
        first.resolve(createReviewWithFlags());
        await pending;
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2);
    });

    it("drops the queued refresh when the load fails", async () => {
        let fail: (error: Error) => void = () => undefined;
        setup.getTargetReview.execute.mockReturnValueOnce(
            new Promise<ReviewWithFlags | null>((_, reject) => {
                fail = reject;
            })
        );
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2));
        setup.activity.notify(signalFor());

        fail(new Error("Network."));
        await pending;
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2);
        expect(setup.presenter.vm.status).toBe("failed");
    });

    it("refreshes once for its own actionDone: its own signal is ignored", async () => {
        setup.presenter.openAction("approve", "step-1");

        await setup.presenter.actionDone();
        await flush();

        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(2);
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
        const afterAction = setup.getTargetReview.execute.mock.calls.length;

        setup.activity.notify(signalFor());
        await vi.waitFor(() =>
            expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(afterAction + 1)
        );
    });

    it("drops the previous subscription on a second init", async () => {
        await setup.presenter.init(createParams());

        expect(setup.activity.subscribe).toHaveBeenCalledTimes(2);
        expect(setup.activity.listenerCount()).toBe(1);
    });

    it("drops the subscription on dispose and ignores later signals", async () => {
        setup.presenter.dispose();

        expect(setup.activity.listenerCount()).toBe(0);
        setup.activity.notify(signalFor());
        await flush();
        expect(setup.getTargetReview.execute).toHaveBeenCalledTimes(1);
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

    beforeEach(() => {
        setup = createSetup();
    });

    const initRunning = async (reloader: IReviewContentReloader | null) => {
        setup.getTargetReview.execute.mockResolvedValue(runningReview());
        await setup.presenter.init(createParams({ contentReloader: reloader }));
    };

    it("reloads once after a running AI step finished and shows the notice with auto_awesome", async () => {
        const { reload, reloader } = createReloader(true);
        await initRunning(reloader);
        expect(reload).not.toHaveBeenCalled();
        expect(setup.presenter.vm.contentNotice).toBeNull();

        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
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
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();
        await setup.presenter.refresh();

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it("uses bolt for an automation step", async () => {
        const { reloader } = createReloader(true);
        setup.getTargetReview.execute.mockResolvedValue(
            createReviewWithFlags(
                createReview({
                    steps: [createRunningAutomationStep({ state: StepState.InReview })]
                })
            )
        );
        await setup.presenter.init(createParams({ contentReloader: reloader }));

        setup.getTargetReview.execute.mockResolvedValue(
            createReviewWithFlags(
                createReview({
                    steps: [createRunningAutomationStep({ state: StepState.Approved })]
                })
            )
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
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(reload).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("sets no notice and keeps the loaded review when the reloader throws", async () => {
        const { reload, reloader } = createReloader(new Error("Reload failed."));
        await initRunning(reloader);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

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
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(seen).toEqual(["active"]);
        expect(setup.activity.subscribe).toHaveBeenCalledTimes(subscriptions);
        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledTimes(2);
    });

    it("does not reload on the first load, even for a finished step", async () => {
        const { reload, reloader } = createReloader(true);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

        await setup.presenter.init(createParams({ contentReloader: reloader }));

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
        setup.getTargetReview.execute.mockResolvedValue(
            createReviewWithFlags(createReview({ steps: [person(StepState.InReview)] }))
        );
        await setup.presenter.init(createParams({ contentReloader: reloader }));

        setup.getTargetReview.execute.mockResolvedValue(
            createReviewWithFlags(createReview({ steps: [person(StepState.Approved)] }))
        );
        await setup.presenter.refresh();

        expect(reload).not.toHaveBeenCalled();
    });

    it("does nothing without a reloader", async () => {
        await initRunning(null);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

        await setup.presenter.refresh();

        expect(setup.presenter.vm.contentNotice).toBeNull();
        expect(setup.presenter.vm.status).toBe("active");
    });

    it("reloads when a live signal brings the finished step", async () => {
        const { reload, reloader } = createReloader(true);
        await initRunning(reloader);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());

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
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
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
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
        await setup.presenter.refresh();
        expect(setup.presenter.vm.contentNotice).not.toBeNull();

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("clears the notice on dispose", async () => {
        const { reloader } = createReloader(true);
        await initRunning(reloader);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
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
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

        setup.presenter.dispose();
        release(true);
        await pending;

        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("does not reload when the presenter is disposed during the publish await", async () => {
        const { reload, reloader } = createReloader(true);
        await initRunning(reloader);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
        const gate = createDeferred<undefined>();
        setup.publisher.publish.mockReturnValueOnce(gate.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.publisher.publish).toHaveBeenCalledTimes(2));

        setup.presenter.dispose();
        gate.resolve(undefined);
        await pending;

        expect(reload).not.toHaveBeenCalled();
        expect(setup.presenter.vm.contentNotice).toBeNull();
    });

    it("does not call the old reloader when re-initialised during the publish await", async () => {
        const old = createReloader(true);
        await initRunning(old.reloader);
        setup.getTargetReview.execute.mockResolvedValue(finishedReview());
        const gate = createDeferred<undefined>();
        setup.publisher.publish.mockReturnValueOnce(gate.promise);
        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(setup.publisher.publish).toHaveBeenCalledTimes(2));

        const other = createReloader(true);
        const otherTarget = { namespace: TARGET.namespace, targetRevisionId: "entry-2#0001" };
        setup.getTargetReview.execute.mockResolvedValue(null);
        await setup.presenter.init(
            createParams({ target: otherTarget, contentReloader: other.reloader })
        );
        gate.resolve(undefined);
        await pending;

        expect(old.reload).not.toHaveBeenCalled();
        expect(other.reload).not.toHaveBeenCalled();
    });
});
