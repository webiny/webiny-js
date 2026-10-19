import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollector/ActiveReviewBlockCollector.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { DeleteEntryUseCaseReviewDecorator } from "./DeleteEntryUseCaseReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function createRefusal(action: "trash" | "delete" = "trash") {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action,
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 2,
                    stepCount: 3,
                    stepName: "Legal"
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
    container.registerInstance(DeleteEntryUseCase, decoratee);
    container.registerDecorator(DeleteEntryUseCaseReviewDecorator);

    return { confirm, decoratee, useCases, useCase: container.resolve(DeleteEntryUseCase) };
}

describe("DeleteEntryUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the trash succeeds", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith({ model: MODEL, id: "entry-1" });
        expect(confirm).not.toHaveBeenCalled();
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("on the server refusal warns, cancels the whole entry once and repeats the trash", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal("trash")).mockResolvedValueOnce(true);

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(true);
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed, with nothing cancelled or repeated", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });

    it("rethrows any other error unchanged", async () => {
        const { confirm, decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase.execute({ model: MODEL, id: "entry-1" }).catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("propagates a second refusal after the repeat", async () => {
        const { confirm, decoratee, useCase } = setup();
        const second = createRefusal();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockRejectedValueOnce(second);

        const error = await useCase.execute({ model: MODEL, id: "entry-1" }).catch(e => e);

        expect(error).toBe(second);
        expect(confirm).toHaveBeenCalledTimes(1);
    });

    it("is not applied when the decorator is not registered (flag off)", async () => {
        const decoratee = { execute: vi.fn() };
        const refusal = createRefusal();
        decoratee.execute.mockRejectedValue(refusal);
        const container = new Container();
        container.registerInstance(DeleteEntryUseCase, decoratee);

        const error = await container
            .resolve(DeleteEntryUseCase)
            .execute({ model: MODEL, id: "entry-1" })
            .catch(e => e);

        expect(error).toBe(refusal);
    });
});
