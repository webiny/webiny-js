import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollector/ActiveReviewBlockCollector.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { DeleteEntryRevisionUseCaseReviewDecorator } from "./DeleteEntryRevisionUseCaseReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function createRefusal() {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action: "delete",
            reviews: [
                {
                    reviewId: "review-2",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0002",
                    title: "Launch article",
                    stepPosition: 1,
                    stepCount: 2,
                    stepName: "Editor"
                }
            ]
        }
    });
}

function setup(decision: "confirm" | "dismiss" = "confirm") {
    const confirm = vi.fn(
        async (_name: string, _params: unknown, execute?: (data: unknown) => Promise<unknown>) => {
            if (decision === "dismiss") {
                return false;
            }
            return execute ? execute(undefined) : undefined;
        }
    );
    const decoratee = { execute: vi.fn() };
    const useCases = {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => []),
        listBlockingReviews: vi.fn(async () => [])
    };

    const container = new Container();
    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    } as unknown as Notifications.Interface);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    container.registerInstance(
        CmsReviewUseCases,
        useCases as unknown as CmsReviewUseCases.Interface
    );
    container.registerInstance(DeleteEntryRevisionUseCase, decoratee);
    container.registerDecorator(DeleteEntryRevisionUseCaseReviewDecorator);

    return {
        confirm,
        decoratee,
        useCases,
        useCase: container.resolve(DeleteEntryRevisionUseCase)
    };
}

describe("DeleteEntryRevisionUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the delete succeeds", async () => {
        const { confirm, decoratee, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ model: MODEL, revisionId: "entry-1#0002" });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({
            model: MODEL,
            revisionId: "entry-1#0002"
        });
        expect(confirm).not.toHaveBeenCalled();
    });

    it("on the server refusal cancels only that revision's reviews, then repeats the delete", async () => {
        const { decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockResolvedValueOnce(true);

        const result = await useCase.execute({ model: MODEL, revisionId: "entry-1#0002" });

        expect(result).toBe(true);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            action: "delete"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ model: MODEL, revisionId: "entry-1#0002" });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("rethrows any other error unchanged", async () => {
        const { decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase
            .execute({ model: MODEL, revisionId: "entry-1#0002" })
            .catch(e => e);

        expect(error).toBe(failure);
    });
});
