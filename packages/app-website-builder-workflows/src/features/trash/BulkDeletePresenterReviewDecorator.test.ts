import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { REVIEW_TOAST_DURATION } from "@webiny/app-workflows/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "@webiny/app-workflows/review/toasts/constants.js";
import { ActiveReviewGuard as GuardAbstraction } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { DeletePageUseCaseReviewDecorator } from "./DeletePageUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

function page(entryId: string): Page {
    return Page.create({
        id: `${entryId}#0001`,
        entryId,
        properties: { title: `Title ${entryId}` }
    });
}

function createRefusal(entryId: string) {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "wb.page",
            action: "trash",
            reviews: [
                {
                    reviewId: `review-${entryId}`,
                    model: "wb.page",
                    targetId: entryId,
                    targetRevisionId: `${entryId}#0001`,
                    title: `Title ${entryId}`,
                    stepPosition: 1,
                    stepCount: 2,
                    stepName: "Editor"
                }
            ]
        }
    });
}

function createUseCases() {
    return {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => []),
        listBlockingReviews: vi.fn(async () => [])
    };
}

describe("BulkDeletePresenterReviewDecorator (forwarding)", () => {
    function setupForwarding() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: Page[]) => undefined)
        };
        const useCases = createUseCases();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
                await params.run(params.items, true);
            })
        };

        const container = new Container();
        container.registerInstance(
            GuardAbstraction,
            guard as unknown as GuardAbstraction.Interface
        );
        container.registerInstance(
            WbReviewUseCases,
            useCases as unknown as WbReviewUseCases.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            decoratee,
            guard,
            useCases,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    it("hands the items, the page id, the use cases and a run callback to the guard", async () => {
        const { guard, useCases, presenter } = setupForwarding();
        const items = [page("p1"), page("p2")];

        await presenter.execute(items);

        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        const params = guard.runBulk.mock.calls[0][0];
        expect(params.items).toBe(items);
        expect(params.useCases).toBe(useCases);
        expect(params.getTargetId(items[0])).toBe("p1");
    });

    it("runs the decoratee with the batch only, for the first run and the retry", async () => {
        const { decoratee, presenter } = setupForwarding();
        const items = [page("p1")];

        await presenter.execute(items);

        expect(decoratee.execute).toHaveBeenCalledTimes(2);
        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items);
    });

    it("delegates the view model to the decoratee", () => {
        const { decoratee, presenter } = setupForwarding();

        expect(presenter.vm).toBe(decoratee.vm);
    });
});

describe("BulkDeletePresenterReviewDecorator (with the real guard and the per-page decorator)", () => {
    function setupIntegrated(decision: "confirm" | "deferred") {
        let release: () => void = () => undefined;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const confirm = vi.fn(
            async (
                _name: string,
                _params: unknown,
                execute?: (data: unknown) => Promise<unknown>
            ) => {
                if (decision === "deferred") {
                    await gate;
                }
                return execute ? execute(undefined) : undefined;
            }
        );
        const blocked = new Set(["p1", "p3"]);
        const deleted: string[] = [];
        const failed: string[] = [];
        const deletePage = {
            execute: vi.fn(async (params: { id: string; permanently: boolean }) => {
                const entryId = params.id.split("#")[0];
                if (blocked.has(entryId)) {
                    throw createRefusal(entryId);
                }
                deleted.push(entryId);
                return true;
            })
        };
        const useCases = createUseCases();
        useCases.cancelForDelete.mockImplementation(async params => {
            blocked.delete(params.targetId);
            return [];
        });

        const container = new Container();
        container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
        // The real guard reports the first-pass count through Notifications (Task 33).
        const notifications = { notify: vi.fn(), success: vi.fn(), warning: vi.fn() };
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        container.registerInstance(
            WbReviewUseCases,
            useCases as unknown as WbReviewUseCases.Interface
        );
        container.registerInstance(DeletePageUseCase, deletePage);
        container.registerDecorator(DeletePageUseCaseReviewDecorator);

        // Stands in for the base presenter: a per-page series that calls the decorated use case.
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (items: Page[]) => {
                const useCase = container.resolve(DeletePageUseCase);
                for (const item of items) {
                    // Like the base presenter: a false result is "not deleted", reported as failed.
                    const result = await useCase.execute({ id: item.id, permanently: false });
                    if (result === false) {
                        failed.push(item.entryId);
                    }
                }
            })
        };
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            release,
            deleted,
            failed,
            decoratee,
            useCases,
            notifications,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [page("p1"), page("p2"), page("p3")];

    it("collects every refused page, warns once and retries only the blocked pages", async () => {
        const { confirm, deleted, failed, decoratee, useCases, notifications, presenter } =
            setupIntegrated("confirm");

        await presenter.execute(items);

        // First pass: p2 was done, p1 and p3 were refused (Q28, Task 33).
        expect(notifications.warning).toHaveBeenCalledTimes(1);
        expect(notifications.warning).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "1 of 3 items done. 2 still need your confirmation.",
                position: REVIEW_TOAST_POSITION,
                duration: REVIEW_TOAST_DURATION,
                dismissible: true
            })
        );

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as GuardAbstraction.DialogParams;
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-p1",
            "review-p3"
        ]);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "wb.page",
            targetId: "p1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
        expect(decoratee.execute.mock.calls[1][0].map(item => item.entryId)).toEqual(["p1", "p3"]);
        expect(failed).toEqual(["p1", "p3"]);
        expect(deleted).toEqual(["p2", "p1", "p3"]);
    });

    it("resolves execute only after the warning flow has ended (R228)", async () => {
        const { confirm, release, presenter } = setupIntegrated("deferred");
        const settled = vi.fn();

        const promise = presenter.execute(items).then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;
        expect(settled).toHaveBeenCalledTimes(1);
    });
});
