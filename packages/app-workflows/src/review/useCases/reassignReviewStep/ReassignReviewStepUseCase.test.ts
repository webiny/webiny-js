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
import { ReassignReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ReassignReviewStepUseCase } from "./ReassignReviewStepUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "wb.page",
    reviewId: "review-1",
    stepId: "step-1",
    userId: "user-9"
};

describe("ReassignReviewStepUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ReassignReviewStepUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("reassigns the step to the user and maps the review", async () => {
        const dto = createReviewDto({ id: "review-5", model: "wb.page" });
        gateway.reassignStep.mockResolvedValue(dto);

        const result = await useCase.execute(params);

        expect(gateway.reassignStep).toHaveBeenCalledTimes(1);
        expect(gateway.reassignStep).toHaveBeenCalledWith(params);
        expect(result.id).toBe("review-5");
        expect(result.namespace).toBe("wb.page");
    });
});
