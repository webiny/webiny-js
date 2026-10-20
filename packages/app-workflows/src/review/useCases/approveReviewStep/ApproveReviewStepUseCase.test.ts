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
import { ApproveReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    comment: "Looks good."
};

describe("ApproveReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ApproveReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("approves the step with the comment and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.approveStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.approveStep).toHaveBeenCalledTimes(1);
        expect(gateway.approveStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("keeps a null comment", async () => {
        const dto = createReviewDto();
        gateway.approveStep.mockResolvedValue(dto);
        const withoutComment: UseCaseAbstraction.Params = { ...params, comment: null };

        await useCase.execute(withoutComment);

        expect(gateway.approveStep).toHaveBeenCalledWith(withoutComment);
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.approveStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
