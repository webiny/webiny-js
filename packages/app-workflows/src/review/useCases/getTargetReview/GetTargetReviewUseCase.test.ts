import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import type { ReviewTarget } from "~/review/domain/types.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import { ReviewRepository } from "~/review/repository/ReviewRepository.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";
import { GetTargetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetTargetReviewUseCase } from "./GetTargetReviewUseCase.js";

const target: ReviewTarget = { namespace: "cms.article", targetRevisionId: "entry-1#0001" };

describe("GetTargetReviewUseCase", () => {
    let gateway: FakeReviewGateway;
    let useCase: UseCaseAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        container.register(GetTargetReviewUseCase);
        useCase = container.resolve(UseCaseAbstraction);
    });

    it("passes the target and maps the review with its flags", async () => {
        const flags = createViewerFlagsDto({ canApprove: true });
        const dto = createReviewWithFlagsDto({ flags });
        gateway.getTargetReview.mockResolvedValue(dto);

        const result = await useCase.execute(target);

        expect(gateway.getTargetReview).toHaveBeenCalledWith(target);
        expect(result?.review.id).toBe("review-1");
        expect(result?.review.namespace).toBe("cms.article");
        expect(result?.flags.canApprove).toBe(true);
    });

    it("returns null when the revision has no review (a value, R346)", async () => {
        gateway.getTargetReview.mockResolvedValue(null);

        await expect(useCase.execute(target)).resolves.toBeNull();
    });
});
