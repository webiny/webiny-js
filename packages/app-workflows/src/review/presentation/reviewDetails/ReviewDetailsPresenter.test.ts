import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewDetailsPresenterFeature } from "./feature.js";
import type { ReviewDetailsInitParams } from "./abstractions.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

interface Setup {
    presenter: ReturnType<typeof ReviewDetailsPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    activity: { subscribe: ReturnType<typeof vi.fn>; notify: ReturnType<typeof vi.fn> };
    onClose: ReturnType<typeof vi.fn>;
    onChanged: ReturnType<typeof vi.fn>;
    params: () => ReviewDetailsInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const activity = { subscribe: vi.fn(), notify: vi.fn() };
    container.registerInstance(ReviewActivity, activity);
    ReviewDetailsPresenterFeature.register(container);
    const { presenter } = ReviewDetailsPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    useCases.getReview.mockResolvedValue(
        createReviewWithFlags(createReview(), createFlags({ canStart: true }))
    );
    const onClose = vi.fn();
    const onChanged = vi.fn();
    return {
        presenter,
        useCases,
        activity,
        onClose,
        onChanged,
        params: () => ({
            useCases,
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

        expect(setup.useCases.getReview).toHaveBeenCalledWith("review-1");
        expect(setup.presenter.vm.status).toBe("loaded");
        expect(setup.presenter.vm.header?.title).toBe("Spring campaign");
        expect(setup.presenter.vm.actions.map(action => action.kind)).toEqual(["start"]);
    });

    it("fails with the design text when the load rejects", async () => {
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.error).toBe("The server did not respond. Try again in a moment.");
    });

    it("fails with the server message of a rejection that is not classified", async () => {
        setup.useCases.getReview.mockRejectedValue(
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
        setup.useCases.getReview.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.error).toBe(NO_ACCESS_MESSAGE);
    });

    it("retries with refresh while keeping the loaded view during a reload", async () => {
        await setup.presenter.init(setup.params());
        let release: (value: ReturnType<typeof createReviewWithFlags>) => void = () => undefined;
        setup.useCases.getReview.mockReturnValue(
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
        setup.useCases.getReview.mockRejectedValueOnce(new Error("Network."));
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

    it("refreshes, signals the activity bus and tells the host after an action", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.openAction("start", "step-1");

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.openAction).toBeNull();
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
        expect(setup.onChanged).toHaveBeenCalledTimes(1);
    });

    it("signals the activity bus and the host even when the refresh after an action fails", async () => {
        await setup.presenter.init(setup.params());
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.actionDone();

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "own",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
        expect(setup.onChanged).toHaveBeenCalledTimes(1);
    });

    it("ignores a late response after dispose and resets", async () => {
        let release: (value: ReturnType<typeof createReviewWithFlags>) => void = () => undefined;
        setup.useCases.getReview.mockReturnValue(
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
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
        ReviewDetailsPresenterFeature.register(container);
        const first = ReviewDetailsPresenterFeature.resolve(container).presenter;
        const second = ReviewDetailsPresenterFeature.resolve(container).presenter;
        expect(first).not.toBe(second);
    });
});
