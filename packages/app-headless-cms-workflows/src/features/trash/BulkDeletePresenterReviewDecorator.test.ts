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
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListBlockingReviewsParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { BlockingReview } from "@webiny/app-workflows/review/domain/types.js";
import { createBlockingReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { NO_ACCESS_MESSAGE } from "@webiny/app-workflows/review/presentation/noAccessMessage.js";
import { GENERIC_ERROR } from "@webiny/app-workflows/review/presentation/actionDialog/reviewErrorMessages.js";
import { REVIEW_TOAST_DURATION } from "@webiny/app-workflows/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "@webiny/app-workflows/review/toasts/constants.js";
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
        listBlockingReviews: vi.fn(
            async (_params: ListBlockingReviewsParams): Promise<BlockingReview[]> => []
        )
    };
}

function createNotifications() {
    return { notify: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
}

function createModelContext(model: CmsModel = MODEL) {
    return { getModel: vi.fn(() => model), setModel: vi.fn() };
}

describe("BulkDeletePresenterReviewDecorator (forwarding)", () => {
    function setupForwarding() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        const useCases = createUseCases();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
                await params.run(params.items, true);
            }),
            confirmBlocking: vi.fn()
        };

        const container = new Container();
        container.registerInstance(
            Notifications,
            createNotifications() as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
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

    it("runs the series per item on the first run and on the retry when not all rows are selected", async () => {
        const { decoratee, guard, useCases, presenter } = setupForwarding();
        const items = [entry("e1")];

        await presenter.execute(items, false);

        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items, false);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items, false);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        expect(useCases.listBlockingReviews).not.toHaveBeenCalled();
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
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
                return true;
            })
        };
        // The real guard reports the first-pass count through Notifications (Task 33).
        const notifications = createNotifications();
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
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

describe("BulkDeletePresenterReviewDecorator (all selected: pre-check by ids)", () => {
    function setupPrecheck(model: CmsModel = MODEL) {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        const useCases = createUseCases();
        const notifications = createNotifications();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(),
            confirmBlocking: vi.fn(async (params: GuardAbstraction.ConfirmBlockingParams) => {
                await params.afterCancel();
                return true;
            })
        };

        const container = new Container();
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext(model));
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

        return {
            decoratee,
            useCases,
            notifications,
            guard,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [entry("e1"), entry("e2"), entry("e3")];

    it("asks for the blocking reviews of the entry ids and runs the bulk task when none block", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();

        await presenter.execute(items, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(1);
        expect(useCases.listBlockingReviews).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetIds: ["e1", "e2", "e3"]
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith(items, true);
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(guard.runBulk).not.toHaveBeenCalled();
    });

    it("takes the namespace from the model context, not from the rows", async () => {
        const pageModel = { modelId: "page", singularApiName: "Page" } as CmsModel;
        const { useCases, presenter } = setupPrecheck(pageModel);

        await presenter.execute(items, true);

        expect(useCases.listBlockingReviews.mock.calls[0][0].namespace).toBe("cms.page");
    });

    it("opens the warning with the blocking reviews and runs the bulk task after the cancel", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();
        const reviews = [
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" }),
            createBlockingReview({ reviewId: "review-e3", targetId: "e3" })
        ];
        useCases.listBlockingReviews.mockResolvedValue(reviews);

        await presenter.execute(items, true);

        expect(guard.confirmBlocking).toHaveBeenCalledTimes(1);
        const params = guard.confirmBlocking.mock.calls[0][0];
        expect(params.reviews).toEqual(reviews);
        expect(params.action).toBe("trash");
        expect(params.useCases).toBe(useCases);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith(items, true);
    });

    it("does not start the bulk task before the warning is confirmed", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" })
        ]);
        guard.confirmBlocking.mockImplementation(async () => {
            expect(decoratee.execute).not.toHaveBeenCalled();
            return false;
        });

        await presenter.execute(items, true);

        expect(guard.confirmBlocking).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("runs nothing when the warning is dismissed", async () => {
        const { decoratee, useCases, notifications, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" })
        ]);
        guard.confirmBlocking.mockResolvedValue(false);

        await presenter.execute(items, true);

        expect(decoratee.execute).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("lets a failing cancel propagate and does not start the bulk task", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" })
        ]);
        const failure = new Error("Could not cancel");
        guard.confirmBlocking.mockRejectedValue(failure);

        const error = await presenter.execute(items, true).catch(e => e);

        expect(error).toBe(failure);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("checks 450 ids in three sequential calls of 200, 200 and 50", async () => {
        const { useCases, presenter } = setupPrecheck();
        const many: CmsContentEntry[] = [];
        for (let index = 1; index <= 450; index++) {
            many.push(entry(`e${index}`));
        }
        let inFlight = 0;
        let maxInFlight = 0;
        useCases.listBlockingReviews.mockImplementation(async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await Promise.resolve();
            inFlight--;
            return [];
        });

        await presenter.execute(many, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(3);
        const sizes = useCases.listBlockingReviews.mock.calls.map(call => {
            return call[0].targetIds.length;
        });
        expect(sizes).toEqual([200, 200, 50]);
        expect(useCases.listBlockingReviews.mock.calls[0][0].targetIds[0]).toBe("e1");
        expect(useCases.listBlockingReviews.mock.calls[1][0].targetIds[0]).toBe("e201");
        expect(useCases.listBlockingReviews.mock.calls[2][0].targetIds[0]).toBe("e401");
        expect(maxInFlight).toBe(1);
    });

    it("sends exactly 200 ids in one call", async () => {
        const { useCases, presenter } = setupPrecheck();
        const exact: CmsContentEntry[] = [];
        for (let index = 1; index <= 200; index++) {
            exact.push(entry(`e${index}`));
        }

        await presenter.execute(exact, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(1);
        expect(useCases.listBlockingReviews.mock.calls[0][0].targetIds).toHaveLength(200);
    });

    it("sends each entry id once when several revisions of an entry are loaded", async () => {
        const { useCases, presenter } = setupPrecheck();
        const rows = [
            entry("e1"),
            { ...entry("e1"), id: "e1#0002" } as CmsContentEntry,
            entry("e2")
        ];

        await presenter.execute(rows, true);

        expect(useCases.listBlockingReviews.mock.calls[0][0].targetIds).toEqual(["e1", "e2"]);
    });

    it("collects the reviews of every chunk into one warning", async () => {
        const { useCases, guard, presenter } = setupPrecheck();
        const many: CmsContentEntry[] = [];
        for (let index = 1; index <= 250; index++) {
            many.push(entry(`e${index}`));
        }
        useCases.listBlockingReviews
            .mockResolvedValueOnce([
                createBlockingReview({ reviewId: "review-e5", targetId: "e5" })
            ])
            .mockResolvedValueOnce([
                createBlockingReview({ reviewId: "review-e230", targetId: "e230" })
            ]);

        await presenter.execute(many, true);

        expect(guard.confirmBlocking).toHaveBeenCalledTimes(1);
        const params = guard.confirmBlocking.mock.calls[0][0];
        expect(params.reviews.map(review => review.targetId)).toEqual(["e5", "e230"]);
    });

    it("shows the generic error toast and runs nothing when the pre-check fails", async () => {
        const { decoratee, useCases, notifications, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockRejectedValue(new Error("Network down"));

        await presenter.execute(items, true);

        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith({
            title: GENERIC_ERROR,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("shows the no-access text for a not authorized error", async () => {
        const { decoratee, useCases, notifications, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockRejectedValue(
            new GraphQLOperationError({
                message: "Not authorized.",
                code: ReviewErrorCode.NotAuthorized,
                data: null
            })
        );

        await presenter.execute(items, true);

        expect(notifications.error.mock.calls[0][0].title).toBe(NO_ACCESS_MESSAGE);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("stops at the first failing chunk and runs nothing", async () => {
        const { decoratee, useCases, notifications, guard, presenter } = setupPrecheck();
        const many: CmsContentEntry[] = [];
        for (let index = 1; index <= 450; index++) {
            many.push(entry(`e${index}`));
        }
        useCases.listBlockingReviews
            .mockResolvedValueOnce([
                createBlockingReview({ reviewId: "review-e5", targetId: "e5" })
            ])
            .mockRejectedValueOnce(new Error("Network down"));

        await presenter.execute(many, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(2);
        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("does not check anything when no row is selected", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();

        await presenter.execute([], true);

        expect(useCases.listBlockingReviews).not.toHaveBeenCalled();
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledWith([], true);
    });
});

describe("BulkDeletePresenterReviewDecorator (result: did the bulk trash start)", () => {
    function setupResult() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        const useCases = createUseCases();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
            }),
            confirmBlocking: vi.fn(async (params: GuardAbstraction.ConfirmBlockingParams) => {
                await params.afterCancel();
                return true;
            })
        };

        const container = new Container();
        container.registerInstance(
            Notifications,
            createNotifications() as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
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

        return { decoratee, useCases, guard, presenter: container.resolve(BulkDeletePresenter) };
    }

    const items = [entry("e1"), entry("e2")];

    it("is true after a per-item run", async () => {
        const { presenter } = setupResult();

        const started = await presenter.execute(items, false);

        expect(started).toBe(true);
    });

    it("is true when nothing blocks and the bulk task started", async () => {
        const { presenter } = setupResult();

        const started = await presenter.execute(items, true);

        expect(started).toBe(true);
    });

    it("is the result of the bulk task when nothing blocks", async () => {
        const { decoratee, presenter } = setupResult();
        decoratee.execute.mockResolvedValue(false);

        const started = await presenter.execute(items, true);

        expect(started).toBe(false);
    });

    it("is true when the warning was confirmed and the bulk task started", async () => {
        const { useCases, presenter } = setupResult();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" })
        ]);

        const started = await presenter.execute(items, true);

        expect(started).toBe(true);
    });

    it("is false when the warning was dismissed", async () => {
        const { useCases, guard, presenter } = setupResult();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" })
        ]);
        guard.confirmBlocking.mockResolvedValue(false);

        const started = await presenter.execute(items, true);

        expect(started).toBe(false);
    });

    it("is false when the pre-check failed", async () => {
        const { useCases, presenter } = setupResult();
        useCases.listBlockingReviews.mockRejectedValue(new Error("Network down"));

        const started = await presenter.execute(items, true);

        expect(started).toBe(false);
    });
});

describe("BulkDeletePresenterReviewDecorator (all selected, with the real guard)", () => {
    function setupReal(decision: "confirm" | "dismiss") {
        const confirm = vi.fn(
            async (
                _name: string,
                _params: unknown,
                execute?: (data: unknown) => Promise<unknown>
            ) => {
                if (decision === "dismiss") {
                    return false;
                }
                return execute ? execute(undefined) : undefined;
            }
        );
        const order: string[] = [];
        const useCases = createUseCases();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" }),
            createBlockingReview({ reviewId: "review-e3", targetId: "e3" })
        ]);
        useCases.cancelForDelete.mockImplementation(async params => {
            order.push(`cancel:${params.targetId}`);
            return [];
        });
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => {
                order.push("bulk");
                return true;
            })
        };

        const container = new Container();
        container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
        container.registerInstance(
            Notifications,
            createNotifications() as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        container.registerInstance(
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            order,
            useCases,
            decoratee,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [entry("e1"), entry("e2"), entry("e3")];

    it("warns, cancels each blocked entry without a revision, then starts the bulk task for every row", async () => {
        const { confirm, order, useCases, decoratee, presenter } = setupReal("confirm");

        await presenter.execute(items, true);

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as GuardAbstraction.DialogParams;
        expect(dialogParams.action).toBe("trash");
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-e1",
            "review-e3"
        ]);
        expect(useCases.cancelForDelete.mock.calls.map(call => call[0])).toEqual([
            { namespace: "cms.article", targetId: "e1", targetRevisionId: null, action: "trash" },
            { namespace: "cms.article", targetId: "e3", targetRevisionId: null, action: "trash" }
        ]);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith(items, true);
        expect(order).toEqual(["cancel:e1", "cancel:e3", "bulk"]);
    });

    it("cancels nothing and starts nothing when the warning is dismissed", async () => {
        const { useCases, decoratee, presenter } = setupReal("dismiss");

        await presenter.execute(items, true);

        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("rejects and starts no bulk task when a cancel fails", async () => {
        const { useCases, decoratee, presenter } = setupReal("confirm");
        const failure = new Error("Could not cancel");
        useCases.cancelForDelete.mockRejectedValue(failure);

        const error = await presenter.execute(items, true).catch(e => e);

        expect(error).toBe(failure);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });
});
