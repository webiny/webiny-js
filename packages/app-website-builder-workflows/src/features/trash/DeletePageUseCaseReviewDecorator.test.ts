import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollector/ActiveReviewBlockCollector.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/ActiveReviewGuard.js";
import { createTrashUseCaseFakes } from "@webiny/app-workflows/review/testing/createTrashUseCaseFakes.js";
import { registerTrashUseCaseFakes } from "@webiny/app-workflows/review/testing/registerTrashUseCaseFakes.js";
import { DeletePageUseCaseReviewDecorator } from "./DeletePageUseCaseReviewDecorator.js";

function createRefusal() {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "wb.page",
            action: "trash",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "wb.page",
                    targetId: "page-1",
                    targetRevisionId: "page-1#0002",
                    title: "Home page",
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
    const useCases = createTrashUseCaseFakes();

    const container = new Container();
    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    } as unknown as Notifications.Interface);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    registerTrashUseCaseFakes(container, useCases);
    container.registerInstance(DeletePageUseCase, decoratee);
    container.registerDecorator(DeletePageUseCaseReviewDecorator);

    return { confirm, decoratee, useCases, useCase: container.resolve(DeletePageUseCase) };
}

describe("DeletePageUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the trash succeeds", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: false });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ id: "page-1#0002", permanently: false });
        expect(confirm).not.toHaveBeenCalled();
        expect(useCases.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
    });

    it("on the server refusal warns, cancels every revision of the page once and repeats the trash", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockResolvedValueOnce(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: false });

        expect(result).toBe(true);
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(useCases.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(1);
        expect(useCases.cancelReviewsForDelete.execute).toHaveBeenCalledWith({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed, with nothing cancelled or repeated", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ id: "page-1#0002", permanently: false });

        expect(result).toBe(false);
        expect(useCases.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });

    it("rethrows any other error unchanged", async () => {
        const { confirm, decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase
            .execute({ id: "page-1#0002", permanently: false })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("propagates a second refusal after the repeat", async () => {
        const { confirm, decoratee, useCase } = setup();
        const second = createRefusal();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockRejectedValueOnce(second);

        const error = await useCase
            .execute({ id: "page-1#0002", permanently: false })
            .catch(e => e);

        expect(error).toBe(second);
        expect(confirm).toHaveBeenCalledTimes(1);
    });

    it("is not applied when the decorator is not registered (flag off)", async () => {
        const decoratee = { execute: vi.fn() };
        const refusal = createRefusal();
        decoratee.execute.mockRejectedValue(refusal);
        const container = new Container();
        container.registerInstance(DeletePageUseCase, decoratee);

        const error = await container
            .resolve(DeletePageUseCase)
            .execute({ id: "page-1#0002", permanently: false })
            .catch(e => e);

        expect(error).toBe(refusal);
    });
});
