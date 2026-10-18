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
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { TargetReviewPresenterFeature } from "./feature.js";
import type { TargetReviewInitParams } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

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

const createParams = (
    useCases: FakeReviewUseCases,
    overrides: Partial<TargetReviewInitParams> = {}
): TargetReviewInitParams => {
    return {
        useCases,
        target: TARGET,
        targetTitle: "Spring campaign",
        canRequest: true,
        isPublished: false,
        isUnpublished: false,
        ...overrides
    };
};

const createIdentityContext = (teams: ITeam[]): IdentityContext.Interface => {
    const identity = { teams } as unknown as Identity;
    return { getIdentity: () => identity, setIdentity: vi.fn(), clear: vi.fn() };
};

const createSetup = (teams: ITeam[] = []) => {
    const container = new Container();
    const publisher = { publish: vi.fn().mockResolvedValue(undefined) };
    const activity = { subscribe: vi.fn(), notify: vi.fn() };
    container.registerInstance(EventPublisher, publisher);
    container.registerInstance(ReviewActivity, activity);
    container.registerInstance(IdentityContext, createIdentityContext(teams));
    TargetReviewPresenterFeature.register(container);
    const { presenter } = TargetReviewPresenterFeature.resolve(container);
    return { container, presenter, publisher, activity };
};

const publishedPayloads = (publisher: { publish: ReturnType<typeof vi.fn> }) => {
    return publisher.publish.mock.calls.map(call => (call[0] as ReviewChangedEvent).payload);
};

describe("TargetReviewPresenter", () => {
    let setup: ReturnType<typeof createSetup>;
    let useCases: FakeReviewUseCases;

    beforeEach(() => {
        setup = createSetup();
        useCases = createFakeUseCases();
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
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags(review));

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.message).toBe("Waiting in the Legal team pool");
    });

    it("starts in the loading status before init", () => {
        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.allowsEditing).toBe(false);
    });

    it("is loading while init waits for the workflow", async () => {
        const workflow = createDeferred<null>();
        useCases.getBoundWorkflow.mockReturnValue(workflow.promise);

        const pending = setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("loading");
        workflow.resolve(null);
        await pending;
        expect(setup.presenter.vm.status).toBe("noWorkflow");
    });

    it("is noWorkflow when the namespace has no workflow and asks for no review", async () => {
        useCases.getBoundWorkflow.mockResolvedValue(null);

        await setup.presenter.init(createParams(useCases));

        expect(useCases.getBoundWorkflow).toHaveBeenCalledWith(TARGET.namespace);
        expect(useCases.getTargetReview).not.toHaveBeenCalled();
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
        await setup.presenter.init(createParams(useCases));

        expect(useCases.getTargetReview).toHaveBeenCalledWith(TARGET);
        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.actions.map(action => action.kind)).toEqual(["request"]);
        expect(publishedPayloads(setup.publisher)[0].review).toBeNull();
    });

    it("hides the request action when the app passes canRequest false", async () => {
        await setup.presenter.init(createParams(useCases, { canRequest: false }));

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.actions).toEqual([]);
    });

    it("treats a cancelled review as none (D75)", async () => {
        const cancelled = createReviewWithFlags(
            createReview({ state: ReviewState.Cancelled, isActive: false })
        );
        useCases.getTargetReview.mockResolvedValue(cancelled);

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.allowsEditing).toBe(true);
    });

    it("is active with actions from the server flags only", async () => {
        const flags = createFlags({ canStart: true, canReassign: true });
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags(createReview(), flags));

        await setup.presenter.init(createParams(useCases));

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
        useCases.getTargetReview.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("noAccess");
        expect(setup.presenter.vm.allowsEditing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("fails with error on any other error, also a transport error and a workflow error", async () => {
        useCases.getTargetReview.mockRejectedValue(new Error("Network."));
        await setup.presenter.init(createParams(useCases));
        expect(setup.presenter.vm.failureKind).toBe("error");

        useCases.getBoundWorkflow.mockRejectedValue(
            new GraphQLOperationError({ message: "Other.", code: ReviewErrorCode.Validation })
        );
        await setup.presenter.refresh();
        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.failureKind).toBe("error");
        expect(setup.presenter.vm.allowsPublishing).toBe(false);
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("recovers from a failed load with refresh", async () => {
        useCases.getTargetReview.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(createParams(useCases));
        expect(setup.presenter.vm.status).toBe("failed");

        await setup.presenter.refresh();

        expect(setup.presenter.vm.status).toBe("none");
    });

    it("keeps the current view and reports busy while refresh loads", async () => {
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams(useCases));
        const next = createDeferred<ReviewWithFlags | null>();
        useCases.getTargetReview.mockReturnValue(next.promise);

        const pending = setup.presenter.refresh();
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalledTimes(2));

        expect(setup.presenter.vm.status).toBe("active");
        expect(setup.presenter.vm.busy).toBe(true);
        next.resolve(null);
        await pending;
        expect(setup.presenter.vm.status).toBe("none");
        expect(setup.presenter.vm.busy).toBe(false);
    });

    it("publishes an event after every settled load", async () => {
        await setup.presenter.init(createParams(useCases));
        await setup.presenter.refresh();

        expect(setup.publisher.publish).toHaveBeenCalledTimes(2);
        expect(setup.publisher.publish.mock.calls[0][0]).toBeInstanceOf(ReviewChangedEvent);
    });

    it("keeps its state when the event publisher rejects", async () => {
        setup.publisher.publish.mockRejectedValue(new Error("Cache writer failed."));

        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.status).toBe("none");
    });

    it("ignores the response of an old target after a second init (Review Focus 5)", async () => {
        const oldReview = createDeferred<ReviewWithFlags | null>();
        const oldUseCases = createFakeUseCases();
        oldUseCases.getTargetReview.mockReturnValue(oldReview.promise);
        const pending = setup.presenter.init(createParams(oldUseCases));
        await vi.waitFor(() => expect(oldUseCases.getTargetReview).toHaveBeenCalled());

        const newUseCases = createFakeUseCases();
        newUseCases.getTargetReview.mockResolvedValue(null);
        await setup.presenter.init(
            createParams(newUseCases, {
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
        useCases.getTargetReview.mockReturnValue(late.promise);
        const pending = setup.presenter.init(createParams(useCases));
        await vi.waitFor(() => expect(useCases.getTargetReview).toHaveBeenCalled());

        setup.presenter.dispose();
        late.resolve(createReviewWithFlags());
        await pending;

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.publisher.publish).not.toHaveBeenCalled();
    });

    it("keeps two presenters with two use cases independent (Review Focus 1)", async () => {
        const second = TargetReviewPresenterFeature.resolve(setup.container).presenter;
        const otherUseCases = createFakeUseCases();
        otherUseCases.getBoundWorkflow.mockResolvedValue(null);

        await setup.presenter.init(createParams(useCases));
        await second.init(createParams(otherUseCases));

        expect(second).not.toBe(setup.presenter);
        expect(setup.presenter.vm.status).toBe("none");
        expect(second.vm.status).toBe("noWorkflow");
        expect(useCases.getBoundWorkflow).toHaveBeenCalledTimes(1);
        expect(otherUseCases.getBoundWorkflow).toHaveBeenCalledTimes(1);
    });

    it("opens and closes an action", async () => {
        await setup.presenter.init(createParams(useCases));

        setup.presenter.openAction("request", null);
        expect(setup.presenter.vm.openAction).toEqual({ kind: "request", stepId: null });

        setup.presenter.closeAction();
        expect(setup.presenter.vm.openAction).toBeNull();
    });

    it("refreshes, closes the action and notifies the activity bus on actionDone", async () => {
        await setup.presenter.init(createParams(useCases));
        setup.presenter.openAction("request", null);
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());

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
        await setup.presenter.init(createParams(useCases));
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.refresh();
        useCases.getTargetReview.mockResolvedValue(null);

        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: "review-1",
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("signals a null review id when the target has no review before or after the action", async () => {
        useCases.getTargetReview.mockResolvedValue(null);
        await setup.presenter.init(createParams(useCases));

        await setup.presenter.actionDone();

        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: TARGET.namespace,
            source: "own",
            reviewId: null,
            targetRevisionId: TARGET.targetRevisionId
        });
    });

    it("replaces the context without reloading", async () => {
        useCases.getTargetReview.mockResolvedValue(
            createReviewWithFlags(createReview({ state: ReviewState.Approved }))
        );
        await setup.presenter.init(createParams(useCases));
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
        expect(useCases.getTargetReview).toHaveBeenCalledTimes(1);
    });

    it("exposes the target it was initialised with (R-f)", async () => {
        await setup.presenter.init(createParams(useCases));

        expect(setup.presenter.vm.namespace).toBe(TARGET.namespace);
        expect(setup.presenter.vm.targetRevisionId).toBe(TARGET.targetRevisionId);
        expect(setup.presenter.vm.targetTitle).toBe("Spring campaign");
    });

    it("resets everything on dispose (R212)", async () => {
        useCases.getTargetReview.mockResolvedValue(createReviewWithFlags());
        await setup.presenter.init(createParams(useCases));
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
});
