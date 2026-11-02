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
import { CancelReviewsForDeleteUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CancelReviewsForDeleteUseCase } from "./CancelReviewsForDeleteUseCase.js";

const params: UseCaseAbstraction.Params = {
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002",
    action: "delete"
};

describe("CancelReviewsForDeleteUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(CancelReviewsForDeleteUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params and maps every cancelled review", async () => {
        const first = createReviewDto({ id: "review-1" });
        const second = createReviewDto({ id: "review-2" });
        gateway.cancelForDelete.mockResolvedValue([first, second]);

        const result = await useCase.execute(params);

        expect(gateway.cancelForDelete).toHaveBeenCalledWith(params);
        expect(result.map(review => review.id)).toEqual(["review-1", "review-2"]);
    });

    it("accepts no target revision (a whole-target cancel of a page)", async () => {
        gateway.cancelForDelete.mockResolvedValue([]);
        const wholePage: UseCaseAbstraction.Params = {
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        };

        const result = await useCase.execute(wholePage);

        expect(gateway.cancelForDelete).toHaveBeenCalledWith(wholePage);
        expect(result).toEqual([]);
    });
});
