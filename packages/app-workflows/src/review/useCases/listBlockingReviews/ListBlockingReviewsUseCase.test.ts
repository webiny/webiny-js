import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { ListBlockingReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListBlockingReviewsUseCase } from "./ListBlockingReviewsUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    targetIds: ["entry-1", "entry-2"]
};

describe("ListBlockingReviewsUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListBlockingReviewsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the namespace and the ids and maps every review", async () => {
        const first = createBlockingReviewDto({ reviewId: "review-1", targetId: "entry-1" });
        const second = createBlockingReviewDto({ reviewId: "review-2", targetId: "entry-2" });
        gateway.listBlockingReviews.mockResolvedValue([first, second]);

        const result = await useCase.execute(params);

        expect(gateway.listBlockingReviews).toHaveBeenCalledWith(params);
        expect(result.map(review => review.reviewId)).toEqual(["review-1", "review-2"]);
        expect(result[1].targetId).toBe("entry-2");
    });

    it("returns an empty list when no review blocks", async () => {
        gateway.listBlockingReviews.mockResolvedValue([]);

        await expect(useCase.execute(params)).resolves.toEqual([]);
    });
});
