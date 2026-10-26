import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { RestartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RestartReviewStepUseCase } from "./RestartReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    reviewId: "review-1",
    stepId: "step-1"
};

describe("RestartReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(RestartReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("restarts the step and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5" });
        gateway.restartStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.restartStep).toHaveBeenCalledTimes(1);
        expect(gateway.restartStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("cms.article");
    });
});
