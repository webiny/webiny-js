import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";

export interface ReviewGetFaults {
    /** `fail` returns a failed Result, `throw` throws; `null` passes through. Sticky: reset per test. */
    mode: "fail" | "throw" | null;
    /** How many times `get` was called. */
    reads: number;
}

export const reviewGetFaults: ReviewGetFaults = { mode: null, reads: 0 };

class FailingReviewGetImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public async get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        reviewGetFaults.reads += 1;
        if (reviewGetFaults.mode === "fail") {
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        if (reviewGetFaults.mode === "throw") {
            throw new Error("Storage threw.");
        }
        return this.decoratee.get(id);
    }

    public getActiveByTarget(
        params: ReviewRepository.ActiveByTargetParams
    ): ReturnType<ReviewRepository.Interface["getActiveByTarget"]> {
        return this.decoratee.getActiveByTarget(params);
    }

    public countInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["countInProgressByWorkflow"]> {
        return this.decoratee.countInProgressByWorkflow(workflowId);
    }

    public listInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["listInProgressByWorkflow"]> {
        return this.decoratee.listInProgressByWorkflow(workflowId);
    }

    public listByTarget(
        params: ReviewRepository.ByTargetParams
    ): ReturnType<ReviewRepository.Interface["listByTarget"]> {
        return this.decoratee.listByTarget(params);
    }

    public list(
        params: ReviewRepository.ListParams
    ): ReturnType<ReviewRepository.Interface["list"]> {
        return this.decoratee.list(params);
    }

    public listInReviewByOwners(
        ownerIds: string[]
    ): ReturnType<ReviewRepository.Interface["listInReviewByOwners"]> {
        return this.decoratee.listInReviewByOwners(ownerIds);
    }

    public create(review: ReviewData): ReturnType<ReviewRepository.Interface["create"]> {
        return this.decoratee.create(review);
    }

    public update(review: ReviewData): ReturnType<ReviewRepository.Interface["update"]> {
        return this.decoratee.update(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

export const FailingReviewGet = ReviewRepository.createDecorator({
    decorator: FailingReviewGetImpl,
    dependencies: []
});
