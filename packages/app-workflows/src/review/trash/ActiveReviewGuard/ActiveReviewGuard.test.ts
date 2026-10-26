import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import type { BlockingReview } from "~/review/domain/types.js";
import { createTrashUseCaseFakes } from "~/review/testing/createTrashUseCaseFakes.js";
import type { TrashUseCaseFakes } from "~/review/testing/createTrashUseCaseFakes.js";
import { registerTrashUseCaseFakes } from "~/review/testing/registerTrashUseCaseFakes.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { ActiveReviewBlockCollector as CollectorAbstraction } from "../ActiveReviewBlockCollector/abstractions.js";
import { ActiveReviewBlockCollector } from "../ActiveReviewBlockCollector/ActiveReviewBlockCollector.js";
import { ActiveReviewGuard as GuardAbstraction } from "./abstractions.js";
import type { ActiveReviewWarningDialogParams } from "./abstractions.js";
import { ActiveReviewGuard } from "./ActiveReviewGuard.js";
import { ACTIVE_REVIEW_WARNING_DIALOG } from "../constants.js";

interface Item {
    entryId: string;
}

type ConfirmExecute = (data: unknown) => Promise<unknown>;

function createReview(overrides: Partial<BlockingReview> = {}): BlockingReview {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal",
        ...overrides
    };
}

function createRefusal(reviews: BlockingReview[], action: "trash" | "delete" = "trash") {
    const data: ActiveReviewOnTrashData = { model: reviews[0].model, action, reviews };
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data
    });
}

// The open warning, as `ConfirmationImpl` hands it to the dialog.
interface OpenDialog {
    onConfirm(data: unknown): Promise<void>;
    onCancel(): void;
}

/*
 * Mirrors `ConfirmationImpl`: `onConfirm` awaits `execute` and resolves the outer promise with
 * its result, so a throw inside `execute` rejects `onConfirm` (the dialog shows the error and
 * stays open) and leaves the outer promise pending until a later confirm or a cancel (`false`).
 * The dialog confirms or dismisses as soon as it opens; a rejected `onConfirm` is recorded.
 */
function createConfirmation(decision: "confirm" | "dismiss") {
    const dialogs: OpenDialog[] = [];
    const confirmErrors: unknown[] = [];
    const confirm = vi.fn((_name: string, _params: unknown, execute?: ConfirmExecute) => {
        return new Promise(resolve => {
            const dialog: OpenDialog = {
                onConfirm: async data => {
                    if (execute) {
                        const result = await execute(data);
                        resolve(result);
                    } else {
                        resolve(data);
                    }
                },
                onCancel: () => resolve(false)
            };
            dialogs.push(dialog);
            if (decision === "dismiss") {
                dialog.onCancel();
                return;
            }
            dialog.onConfirm(undefined).catch(error => {
                confirmErrors.push(error);
            });
        });
    });
    return {
        confirm,
        dialogs,
        confirmErrors,
        confirmation: { confirm } as unknown as Confirmation.Interface
    };
}

// Like `createConfirmation("confirm")`, but the dialog confirms only after `release`.
function createDeferredConfirmation() {
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => {
        release = resolve;
    });
    const confirm = vi.fn((_name: string, _params: unknown, execute?: ConfirmExecute) => {
        return new Promise(resolve => {
            void gate.then(async () => {
                if (execute) {
                    resolve(await execute(undefined));
                } else {
                    resolve(undefined);
                }
            });
        });
    });
    return {
        confirm,
        release,
        confirmation: { confirm } as unknown as Confirmation.Interface
    };
}

function setup(confirmation: Confirmation.Interface, fakes: TrashUseCaseFakes) {
    const container = new Container();
    registerTrashUseCaseFakes(container, fakes);
    const notifications = {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    };
    container.registerInstance(Confirmation, confirmation);
    container.registerInstance(Notifications, notifications);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    return {
        guard: container.resolve(GuardAbstraction),
        collector: container.resolve(CollectorAbstraction),
        notifications
    };
}

describe("ActiveReviewGuard.run", () => {
    let fakes: TrashUseCaseFakes;

    beforeEach(() => {
        fakes = createTrashUseCaseFakes();
    });

    it("returns the action result and opens nothing when the action succeeds", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);

        const result = await guard.run({
            action: async () => "trashed",
            revisionId: null
        });

        expect(result).toBe("trashed");
        expect(confirm).not.toHaveBeenCalled();
        expect(fakes.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
    });

    it("on confirm cancels each distinct target once, then repeats the action once", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const reviews = [
            createReview({ reviewId: "r1", targetId: "entry-1" }),
            createReview({ reviewId: "r2", targetId: "entry-1", targetRevisionId: "entry-1#0002" }),
            createReview({ reviewId: "r3", targetId: "entry-2", model: "cms.page" })
        ];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal(reviews, "trash");
            }
            return "trashed";
        });
        fakes.cancelReviewsForDelete.execute.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        const result = await guard.run({ action, revisionId: null });

        expect(result).toBe("trashed");
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        expect(confirm.mock.calls[0][1]).toEqual({ reviews, action: "trash" });
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(2);
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenNthCalledWith(1, {
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenNthCalledWith(2, {
            namespace: "cms.page",
            targetId: "entry-2",
            targetRevisionId: null,
            action: "trash"
        });
        expect(action).toHaveBeenCalledTimes(2);
        const lastCancel = Math.max(
            ...fakes.cancelReviewsForDelete.execute.mock.invocationCallOrder
        );
        expect(lastCancel).toBeLessThan(action.mock.invocationCallOrder[1]);
    });

    it("passes the revision id to the cancel for a revision delete and the delete action", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const reviews = [createReview({ targetRevisionId: "entry-1#0002" })];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal(reviews, "delete");
            }
            return true;
        });
        fakes.cancelReviewsForDelete.execute.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        await guard.run({ action, revisionId: "entry-1#0002" });

        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(1);
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            action: "delete"
        });
    });

    it("resolves false on dismiss without cancelling or repeating", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard } = setup(confirmation, fakes);
        const action = vi.fn(async () => {
            throw createRefusal([createReview()]);
        });

        const result = await guard.run({ action, revisionId: null });

        expect(result).toBe(false);
        expect(fakes.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
        expect(action).toHaveBeenCalledTimes(1);
    });

    it("rethrows a plain error unchanged and opens nothing", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const failure = new Error("Network down");

        const error = await guard
            .run({
                action: async () => {
                    throw failure;
                },
                revisionId: null
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("rethrows a GraphQLOperationError with another code unchanged", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const failure = new GraphQLOperationError({
            message: "Not authorized.",
            code: ReviewErrorCode.NotAuthorized,
            data: null
        });

        const error = await guard
            .run({
                action: async () => {
                    throw failure;
                },
                revisionId: null
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("rethrows an ActiveReviewOnTrash error with malformed data unchanged", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const failure = new GraphQLOperationError({
            message: "Refused.",
            code: ReviewErrorCode.ActiveReviewOnTrash,
            data: { reviews: "none" }
        });

        const error = await guard
            .run({
                action: async () => {
                    throw failure;
                },
                revisionId: null
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("shows a second refusal after the repeat in the open dialog, with no second dialog", async () => {
        const { confirm, dialogs, confirmErrors, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const second = createRefusal([createReview({ reviewId: "r2" })]);
        const action = vi
            .fn()
            .mockRejectedValueOnce(createRefusal([createReview()]))
            .mockRejectedValueOnce(second);
        const settled = vi.fn();

        const pending = guard.run({ action, revisionId: null }).then(settled);

        await vi.waitFor(() => expect(confirmErrors).toEqual([second]));
        expect(settled).not.toHaveBeenCalled();
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(action).toHaveBeenCalledTimes(2);

        dialogs[0].onCancel();
        await pending;
        expect(settled).toHaveBeenCalledWith(false);
    });

    it("shows a failing cancel in the open dialog without repeating, and a retry repeats the action", async () => {
        const { dialogs, confirmErrors, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const failure = new Error("Could not cancel");
        fakes.cancelReviewsForDelete.execute.mockRejectedValueOnce(failure);
        const action = vi
            .fn()
            .mockRejectedValueOnce(createRefusal([createReview()]))
            .mockResolvedValueOnce("trashed");
        const settled = vi.fn();

        const pending = guard.run({ action, revisionId: null }).then(settled);

        await vi.waitFor(() => expect(confirmErrors).toEqual([failure]));
        expect(action).toHaveBeenCalledTimes(1);
        expect(settled).not.toHaveBeenCalled();

        await dialogs[0].onConfirm(undefined);
        await pending;

        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(2);
        expect(action).toHaveBeenCalledTimes(2);
        expect(settled).toHaveBeenCalledWith("trashed");
    });

    it("records a refusal of a target that an active bulk run owns and returns false, without a dialog", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard, collector } = setup(confirmation, fakes);
        const runId = collector.begin(["entry-1"]);
        const refusal = createRefusal([createReview({ targetId: "entry-1" })]);

        const result = await guard.run({
            action: async () => {
                throw refusal;
            },
            revisionId: null
        });

        expect(result).toBe(false);
        expect(confirm).not.toHaveBeenCalled();
        collector.end(runId);
        expect(collector.drain(runId)).toHaveLength(1);
    });

    it("does not collect the refusal of an unrelated target while a bulk run is active", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard, collector } = setup(confirmation, fakes);
        const runId = collector.begin(["entry-1"]);
        const reviews = [createReview({ reviewId: "r9", targetId: "entry-9" })];
        let blocked = true;
        fakes.cancelReviewsForDelete.execute.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        await guard.run({
            action: async () => {
                if (blocked) {
                    throw createRefusal(reviews);
                }
                return "trashed";
            },
            revisionId: null
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(1);
        collector.end(runId);
        expect(collector.drain(runId)).toEqual([]);
    });

    it("cancels through the injected use case, one call per distinct target, routed by each review's namespace", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const reviews = [
            createReview({ reviewId: "r1", model: "cms.article", targetId: "entry-1" }),
            createReview({ reviewId: "r2", model: "wb.page", targetId: "page-1" })
        ];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal(reviews, "delete");
            }
            return true;
        });
        fakes.cancelReviewsForDelete.execute.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        await guard.run({ action, revisionId: null });

        const sent = fakes.cancelReviewsForDelete.execute.mock.calls.map(call => call[0]);
        expect(sent).toEqual([
            {
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: null,
                action: "delete"
            },
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: null, action: "delete" }
        ]);
    });
});

describe("ActiveReviewGuard.runBulk", () => {
    let fakes: TrashUseCaseFakes;

    beforeEach(() => {
        fakes = createTrashUseCaseFakes();
    });

    interface BulkSetup {
        run: Mock<(batch: Item[], isRetry: boolean) => Promise<void>>;
        failed: string[];
        blocked: Set<string>;
    }

    function createRun(guard: GuardAbstraction.Interface, blocked: Set<string>): BulkSetup {
        const failed: string[] = [];
        const run = vi.fn(async (batch: Item[], _isRetry: boolean) => {
            for (const item of batch) {
                // Like the presenters: a false result is "not deleted", reported as failed.
                const result = await guard.run({
                    action: async () => {
                        if (blocked.has(item.entryId)) {
                            const review = createReview({
                                reviewId: `review-${item.entryId}`,
                                targetId: item.entryId,
                                targetRevisionId: `${item.entryId}#0001`
                            });
                            throw createRefusal([review]);
                        }
                        return true;
                    },
                    revisionId: null
                });

                if (result === false) {
                    failed.push(item.entryId);
                }
            }
        });
        return { run, failed, blocked };
    }

    const items: Item[] = [{ entryId: "e1" }, { entryId: "e2" }, { entryId: "e3" }];

    it("shows the first-pass summary once when some items were refused (Q27)", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard, notifications } = setup(confirmation, fakes);
        const { run } = createRun(guard, new Set(["e2", "e3"]));

        await guard.runBulk({ items, getTargetId: item => item.entryId, run });

        expect(notifications.warning).toHaveBeenCalledTimes(1);
        expect(notifications.warning).toHaveBeenCalledWith({
            title: "1 of 3 items done. 2 still need your confirmation.",
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
    });

    it("uses the one string with the count as is, also for one refused item (Q28)", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard, notifications } = setup(confirmation, fakes);
        const { run } = createRun(guard, new Set(["e1"]));

        await guard.runBulk({ items, getTargetId: item => item.entryId, run });

        expect(notifications.warning).toHaveBeenCalledWith({
            title: "2 of 3 items done. 1 still need your confirmation.",
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
    });

    it("shows no summary when nothing was refused", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard, notifications } = setup(confirmation, fakes);
        const { run } = createRun(guard, new Set());

        await guard.runBulk({ items, getTargetId: item => item.entryId, run });

        expect(notifications.warning).not.toHaveBeenCalled();
    });

    it("runs once and opens nothing when no item is blocked", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const { run } = createRun(guard, new Set());

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run
        });

        expect(run).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledWith(items, false);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("opens one dialog with every blocked review and retries only the blocked items after confirm", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const blocked = new Set(["e1", "e3"]);
        const { run, failed } = createRun(guard, blocked);
        fakes.cancelReviewsForDelete.execute.mockImplementation(async params => {
            blocked.delete(params.targetId);
            return [];
        });

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams.action).toBe("trash");
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-e1",
            "review-e3"
        ]);
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(2);
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "e1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(run).toHaveBeenCalledTimes(2);
        expect(run).toHaveBeenNthCalledWith(1, items, false);
        expect(run).toHaveBeenNthCalledWith(2, [{ entryId: "e1" }, { entryId: "e3" }], true);
        expect(failed).toEqual(["e1", "e3"]);
    });

    it("does nothing more on dismiss", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard } = setup(confirmation, fakes);
        const { run, failed } = createRun(guard, new Set(["e2"]));

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run
        });

        expect(run).toHaveBeenCalledTimes(1);
        expect(fakes.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
        expect(failed).toEqual(["e2"]);
    });

    it("resolves only after the warning flow has ended", async () => {
        const { confirm, release, confirmation } = createDeferredConfirmation();
        const { guard } = setup(confirmation, fakes);
        const blocked = new Set(["e1"]);
        const { run } = createRun(guard, blocked);
        fakes.cancelReviewsForDelete.execute.mockImplementation(async params => {
            blocked.delete(params.targetId);
            return [];
        });
        const settled = vi.fn();

        const promise = guard
            .runBulk({
                items,
                getTargetId: item => item.entryId,
                run
            })
            .then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;

        expect(settled).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledTimes(2);
    });

    it("reports a second refusal during the retry as a failure, without a nested dialog", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const { run, failed } = createRun(guard, new Set(["e1"]));

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledTimes(2);
        expect(failed).toEqual(["e1", "e1"]);
    });

    it("does not capture an unrelated delete that overlaps the run", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        let sideBlocked = true;
        fakes.cancelReviewsForDelete.execute.mockImplementation(async () => {
            sideBlocked = false;
            return [];
        });
        const run = vi.fn(async (_batch: Item[], _isRetry: boolean) => {
            await guard.run({
                action: async () => {
                    if (sideBlocked) {
                        throw createRefusal([
                            createReview({ reviewId: "r9", targetId: "entry-9" })
                        ]);
                    }
                },
                revisionId: null
            });
        });

        await guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams.reviews.map(review => review.targetId)).toEqual(["entry-9"]);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it("propagates a rejection of run and ends the collect run", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard, collector } = setup(confirmation, fakes);
        const failure = new Error("Network down");
        const run = vi.fn(async (_batch: Item[], _isRetry: boolean) => {
            throw failure;
        });

        const error = await guard
            .runBulk({
                items,
                getTargetId: item => item.entryId,
                run
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
        const refusal: ActiveReviewOnTrashData = {
            model: "cms.article",
            action: "trash",
            reviews: [createReview({ targetId: "e1" })]
        };
        expect(collector.collects(refusal)).toBe(false);
    });

    it("shows a failing cancel in the open dialog, does not retry, and ends on dismiss", async () => {
        const { dialogs, confirmErrors, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const { run } = createRun(guard, new Set(["e1"]));
        const failure = new Error("Could not cancel");
        fakes.cancelReviewsForDelete.execute.mockRejectedValue(failure);
        const settled = vi.fn();

        const pending = guard
            .runBulk({
                items,
                getTargetId: item => item.entryId,
                run
            })
            .then(settled);

        await vi.waitFor(() => expect(confirmErrors).toEqual([failure]));
        expect(run).toHaveBeenCalledTimes(1);
        expect(settled).not.toHaveBeenCalled();

        dialogs[0].onCancel();
        await pending;
        expect(settled).toHaveBeenCalledTimes(1);
        expect(run).toHaveBeenCalledTimes(1);
    });
});

describe("ActiveReviewGuard.confirmBlocking", () => {
    let fakes: TrashUseCaseFakes;

    const reviews = [
        createReview({ reviewId: "r1", targetId: "entry-1" }),
        createReview({ reviewId: "r2", targetId: "entry-1", targetRevisionId: "entry-1#0002" }),
        createReview({ reviewId: "r3", targetId: "entry-2", model: "cms.page" })
    ];

    beforeEach(() => {
        fakes = createTrashUseCaseFakes();
    });

    it("opens the warning with the reviews and the action", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);

        await guard.confirmBlocking({
            reviews,
            action: "trash",
            afterCancel: async () => undefined
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams).toEqual({ reviews, action: "trash" });
    });

    it("on confirm cancels each distinct target once with no revision, then runs afterCancel, and resolves true", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const order: string[] = [];
        fakes.cancelReviewsForDelete.execute.mockImplementation(async params => {
            order.push(`cancel:${params.targetId}`);
            return [];
        });
        const afterCancel = vi.fn(async () => {
            order.push("after");
        });

        const confirmed = await guard.confirmBlocking({
            reviews,
            action: "trash",
            afterCancel
        });

        expect(confirmed).toBe(true);
        expect(fakes.cancelReviewsForDelete.execute.mock.calls.map(call => call[0])).toEqual([
            {
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: null,
                action: "trash"
            },
            {
                namespace: "cms.page",
                targetId: "entry-2",
                targetRevisionId: null,
                action: "trash"
            }
        ]);
        expect(afterCancel).toHaveBeenCalledTimes(1);
        expect(order).toEqual(["cancel:entry-1", "cancel:entry-2", "after"]);
    });

    it("passes the delete action to the dialog and the cancel", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);

        await guard.confirmBlocking({
            reviews: [reviews[0]],
            action: "delete",
            afterCancel: async () => undefined
        });

        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams.action).toBe("delete");
        expect(fakes.cancelReviewsForDelete.execute.mock.calls[0][0].action).toBe("delete");
    });

    it("resolves false on dismiss without cancelling or running afterCancel", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard } = setup(confirmation, fakes);
        const afterCancel = vi.fn(async () => undefined);

        const confirmed = await guard.confirmBlocking({
            reviews,
            action: "trash",
            afterCancel
        });

        expect(confirmed).toBe(false);
        expect(fakes.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
        expect(afterCancel).not.toHaveBeenCalled();
    });

    it("resolves only after afterCancel has finished", async () => {
        const { confirm, release, confirmation } = createDeferredConfirmation();
        const { guard } = setup(confirmation, fakes);
        let afterCancelDone = false;
        const settled = vi.fn();

        const promise = guard
            .confirmBlocking({
                reviews,
                action: "trash",
                afterCancel: async () => {
                    afterCancelDone = true;
                }
            })
            .then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;
        expect(afterCancelDone).toBe(true);
        expect(settled).toHaveBeenCalledWith(true);
    });

    it("shows a failing cancel in the open dialog without running afterCancel, and resolves false on dismiss", async () => {
        const { dialogs, confirmErrors, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const failure = new Error("Could not cancel");
        fakes.cancelReviewsForDelete.execute.mockRejectedValue(failure);
        const afterCancel = vi.fn(async () => undefined);
        const settled = vi.fn();

        const pending = guard
            .confirmBlocking({ reviews, action: "trash", afterCancel })
            .then(settled);

        await vi.waitFor(() => expect(confirmErrors).toEqual([failure]));
        expect(afterCancel).not.toHaveBeenCalled();
        expect(settled).not.toHaveBeenCalled();

        dialogs[0].onCancel();
        await pending;
        expect(settled).toHaveBeenCalledWith(false);
    });

    it("shows a failing afterCancel in the open dialog and resolves true after a successful retry", async () => {
        const { dialogs, confirmErrors, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, fakes);
        const failure = new Error("The bulk task could not start");
        const afterCancel = vi
            .fn<() => Promise<void>>()
            .mockRejectedValueOnce(failure)
            .mockResolvedValueOnce(undefined);
        const settled = vi.fn();

        const pending = guard
            .confirmBlocking({ reviews, action: "trash", afterCancel })
            .then(settled);

        await vi.waitFor(() => expect(confirmErrors).toEqual([failure]));
        expect(fakes.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(2);
        expect(settled).not.toHaveBeenCalled();

        await dialogs[0].onConfirm(undefined);
        await pending;

        expect(afterCancel).toHaveBeenCalledTimes(2);
        expect(settled).toHaveBeenCalledWith(true);
    });
});
