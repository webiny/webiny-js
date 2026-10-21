import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { ListReviewStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewStepCandidatesUseCase } from "./ListReviewStepCandidatesUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "wb.page",
    reviewId: "review-1",
    stepId: "step-1"
};

describe("ListReviewStepCandidatesUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListReviewStepCandidatesUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params with the namespace and maps the candidates", async () => {
        gateway.listReviewStepCandidates.mockResolvedValue([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null }
        ]);

        const result = await useCase.execute(params);

        expect(gateway.listReviewStepCandidates).toHaveBeenCalledWith(params);
        expect(result).toEqual([
            { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null }
        ]);
    });
});
