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
import { ListReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewsUseCase } from "./ListReviewsUseCase.js";

const params: UseCaseAbstraction.Params = {
    app: "wb",
    list: "assignedToMe",
    where: {},
    sort: "lastChangedOn_ASC",
    limit: 5,
    after: null
};

describe("ListReviewsUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(ListReviewsUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the params with the app and returns the mapped page", async () => {
        const review = createReviewDto({ id: "review-3", model: "wb.page" });
        const item = createReviewWithFlagsDto({ review });
        gateway.listReviews.mockResolvedValue({
            data: [item],
            meta: { cursor: "cursor-1", hasMoreItems: true }
        });

        const page = await useCase.execute(params);

        expect(gateway.listReviews).toHaveBeenCalledWith(params);
        expect(page.items.map(entry => entry.review.id)).toEqual(["review-3"]);
        expect(page.items[0].review.namespace).toBe("wb.page");
        expect(page.meta).toEqual({ cursor: "cursor-1", hasMoreItems: true });
    });

    it("reads a missing meta as no more items (R351)", async () => {
        gateway.listReviews.mockResolvedValue({ data: [], meta: null });

        const page = await useCase.execute(params);

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
    });
});
