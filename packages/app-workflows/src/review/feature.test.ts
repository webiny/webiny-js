import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewServicesFeature } from "./feature.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";

const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    return container;
};

describe("ReviewServicesFeature", () => {
    it("registers the three services", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(ReviewActivity)).toBeDefined();
        expect(container.resolve(ReviewToasts)).toBeDefined();
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers the review data layer: gateway and repository singletons, the read use cases transient (R354)", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(ReviewGateway)).toBe(container.resolve(ReviewGateway));
        expect(container.resolve(ReviewRepository)).toBe(container.resolve(ReviewRepository));
        expect(container.resolve(GetBoundWorkflowUseCase)).not.toBe(
            container.resolve(GetBoundWorkflowUseCase)
        );
        expect(container.resolve(GetTargetReviewUseCase)).toBeDefined();
        expect(container.resolve(GetReviewUseCase)).toBeDefined();
        expect(container.resolve(ListStepCandidatesUseCase)).toBeDefined();
        expect(container.resolve(ListReviewStepCandidatesUseCase)).toBeDefined();
        expect(container.resolve(GetStepRunUseCase)).toBeDefined();
        expect(container.resolve(ListReviewsUseCase)).toBeDefined();
    });

    it("registers the review write use cases transient (R354)", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(RequestReviewUseCase)).not.toBe(
            container.resolve(RequestReviewUseCase)
        );
        expect(container.resolve(RequestReviewUseCase)).toBeDefined();
        expect(container.resolve(StartReviewStepUseCase)).toBeDefined();
        expect(container.resolve(TakeOverReviewStepUseCase)).toBeDefined();
        expect(container.resolve(ReassignReviewStepUseCase)).toBeDefined();
        expect(container.resolve(ApproveReviewStepUseCase)).toBeDefined();
        expect(container.resolve(RejectReviewStepUseCase)).toBeDefined();
        expect(container.resolve(CancelReviewUseCase)).toBeDefined();
        expect(container.resolve(RestartReviewStepUseCase)).toBeDefined();
        expect(container.resolve(CancelReviewsForDeleteUseCase)).toBeDefined();
        expect(container.resolve(ListBlockingReviewsUseCase)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        const first = ReviewServicesFeature.resolve(container);
        const second = ReviewServicesFeature.resolve(container);

        expect(first.activity).toBe(second.activity);
        expect(first.toasts).toBe(second.toasts);
        expect(first.notifications).toBe(second.notifications);
        expect(first.activity).toBe(container.resolve(ReviewActivity));
    });

    it("shares one activity bus between the notification service and its subscribers", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);
        const { activity, notifications } = ReviewServicesFeature.resolve(container);
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        notifications.handle({
            data: {
                event: "assigned",
                reviewId: "review-1",
                stepId: "step-1",
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                title: "A review is waiting for you",
                body: "Draft check."
            },
            url: null
        });

        expect(listener).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
    });
});
