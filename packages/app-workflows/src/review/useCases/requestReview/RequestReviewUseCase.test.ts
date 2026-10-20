import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { RequestReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

const params: UseCaseAbstraction.Params = {
    target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
    title: "Launch article",
    picks: [{ stepId: "step-1", userId: "user-9" }]
};

describe("RequestReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(RequestReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("starts a review of the target with the title and the picks and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.requestReview.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.requestReview).toHaveBeenCalledTimes(1);
        expect(gateway.requestReview).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.requestReview.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
