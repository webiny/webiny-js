import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";

export interface ReviewSaveFaults {
    failNext: boolean;
}

/** Set `failNext` to fail the next `save` once; everything else passes through. */
export const reviewSaveFaults: ReviewSaveFaults = { failNext: false };

class FailingReviewSaveImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
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

    public async save(review: ReviewData): ReturnType<ReviewRepository.Interface["save"]> {
        if (reviewSaveFaults.failNext) {
            reviewSaveFaults.failNext = false;
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.save(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

export const FailingReviewSave = ReviewRepository.createDecorator({
    decorator: FailingReviewSaveImpl,
    dependencies: []
});
