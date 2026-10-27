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
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { GetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

describe("GetReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the namespace and the id and maps the review with its flags", async () => {
        const review = createReviewDto({ id: "review-7" });
        const dto = createReviewWithFlagsDto({ review });
        gateway.getReview.mockResolvedValue(dto);

        const result = await useCase.execute({ namespace: "cms.article", reviewId: "review-7" });

        expect(gateway.getReview).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-7"
        });
        expect(result.review.id).toBe("review-7");
        expect(result.flags.canStart).toBe(true);
    });
});
