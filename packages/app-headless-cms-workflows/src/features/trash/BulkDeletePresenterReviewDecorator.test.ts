import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { Result } from "@webiny/app-admin/components/BulkActions/Worker.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewGuard as GuardAbstraction } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { DeleteEntryUseCaseReviewDecorator } from "./DeleteEntryUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function entry(entryId: string): CmsContentEntry {
    return { id: `${entryId}#0001`, entryId, meta: { title: entryId } } as CmsContentEntry;
}

function createRefusal(entryId: string) {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action: "trash",
            reviews: [
                {
                    reviewId: `review-${entryId}`,
                    model: "cms.article",
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

function createNotifications() {
    return { notify: vi.fn(), success: vi.fn(), warning: vi.fn() };
}

describe("BulkDeletePresenterReviewDecorator (forwarding)", () => {
    function setupForwarding() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => undefined)
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
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return { decoratee, guard, useCases, presenter: container.resolve(BulkDeletePresenter) };
    }

    it("hands the items, the entry id, the use cases and a run callback to the guard", async () => {
        const { guard, useCases, presenter } = setupForwarding();
        const items = [entry("e1"), entry("e2")];

        await presenter.execute(items, false);

        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        const params = guard.runBulk.mock.calls[0][0];
        expect(params.items).toBe(items);
        expect(params.useCases).toBe(useCases);
        expect(params.getTargetId(items[0])).toBe("e1");
    });

    it("forwards allSelected on the first run and always false on the retry", async () => {
        const { decoratee, presenter } = setupForwarding();
        const items = [entry("e1")];

        await presenter.execute(items, true);

        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items, true);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items, false);
    });

    it("delegates the view model to the decoratee", () => {
        const { decoratee, presenter } = setupForwarding();

        expect(presenter.vm).toBe(decoratee.vm);
    });
});

describe("BulkDeletePresenterReviewDecorator (with the real guard and the per-item decorator)", () => {
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
        const blocked = new Set(["e1", "e3"]);
        const deleted: string[] = [];
        const failed: string[] = [];
        const deleteEntry = {
            execute: vi.fn(async (params: { id: string }) => {
                if (blocked.has(params.id)) {
                    throw createRefusal(params.id);
                }
                deleted.push(params.id);
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
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        container.registerInstance(
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(DeleteEntryUseCase, deleteEntry);
        container.registerDecorator(DeleteEntryUseCaseReviewDecorator);

        // Stands in for the base presenter: a per-item series that calls the decorated use case.
        const decoratee = {
            vm: { processing: false, results: [] as Result[] },
            execute: vi.fn(async (items: CmsContentEntry[], _allSelected: boolean) => {
                const useCase = container.resolve(DeleteEntryUseCase);
                decoratee.vm.results = [];
                for (const item of items) {
                    // Like the base presenter: a false result is "not deleted", reported as failed.
                    const result = await useCase.execute({ model: MODEL, id: item.entryId });
                    if (result === false) {
                        failed.push(item.entryId);
                        decoratee.vm.results.push({ title: item.entryId, status: "failure" });
                    } else {
                        decoratee.vm.results.push({ title: item.entryId, status: "success" });
                    }
                }
            })
        };
        // The real guard reports the first-pass count through Notifications (Task 33).
        const notifications = createNotifications();
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            release,
            deleted,
            failed,
            decoratee,
            useCases,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [entry("e1"), entry("e2"), entry("e3")];

    it("collects every refused item, warns once and retries only the blocked items", async () => {
        const { confirm, deleted, failed, decoratee, useCases, presenter } =
            setupIntegrated("confirm");

        await presenter.execute(items, false);

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as GuardAbstraction.DialogParams;
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-e1",
            "review-e3"
        ]);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
        expect(decoratee.execute.mock.calls[1][0].map(item => item.entryId)).toEqual(["e1", "e3"]);
        expect(decoratee.execute.mock.calls[1][1]).toBe(false);
        expect(failed).toEqual(["e1", "e3"]);
        expect(deleted).toEqual(["e2", "e1", "e3"]);
    });

    it("resolves execute only after the warning flow has ended (R228)", async () => {
        const { confirm, release, presenter } = setupIntegrated("deferred");
        const settled = vi.fn();

        const promise = presenter.execute(items, false).then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;
        expect(settled).toHaveBeenCalledTimes(1);
    });
});
