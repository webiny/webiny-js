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
import { TakeOverReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1",
    notifyPreviousOwner: true
};

describe("TakeOverReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(TakeOverReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("takes over the step, keeps the notify choice, and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.takeOverStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.takeOverStep).toHaveBeenCalledTimes(1);
        expect(gateway.takeOverStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });

    it("lets a conflict pass unchanged, with its code and data", async () => {
        const failure = new GraphQLOperationError({
            message: "The step is not the current step.",
            code: "Workflows/Review/StepNotCurrent",
            data: { reviewId: "review-1", stepId: "step-1" }
        });
        gateway.takeOverStep.mockRejectedValue(failure);

        await expect(useCase.execute(params)).rejects.toBe(failure);
    });
});
