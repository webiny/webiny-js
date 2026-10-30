import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";

export interface ReviewSaveFaults {
    failNext: boolean;
}

/** Set `failNext` to fail the next `create` or `update` once; everything else passes through. */
export const reviewSaveFaults: ReviewSaveFaults = { failNext: false };

export const resetReviewSaveFaults = (): void => {
    reviewSaveFaults.failNext = false;
};

class FailingReviewSaveImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public getMany(ids: string[]): ReturnType<ReviewRepository.Interface["getMany"]> {
        return this.decoratee.getMany(ids);
    }

    public getActiveByTarget(
        params: ReviewRepository.ActiveByTargetParams
    ): ReturnType<ReviewRepository.Interface["getActiveByTarget"]> {
        return this.decoratee.getActiveByTarget(params);
    }

    public listReviewedModels(): ReturnType<ReviewRepository.Interface["listReviewedModels"]> {
        return this.decoratee.listReviewedModels();
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

    public listByTargets(
        params: ReviewRepository.ByTargetsParams
    ): ReturnType<ReviewRepository.Interface["listByTargets"]> {
        return this.decoratee.listByTargets(params);
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

    public async create(review: ReviewData): ReturnType<ReviewRepository.Interface["create"]> {
        if (reviewSaveFaults.failNext) {
            reviewSaveFaults.failNext = false;
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.create(review);
    }

    public async update(review: ReviewData): ReturnType<ReviewRepository.Interface["update"]> {
        if (reviewSaveFaults.failNext) {
            reviewSaveFaults.failNext = false;
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.update(review);
    }

    public deleteMany(ids: string[]): ReturnType<ReviewRepository.Interface["deleteMany"]> {
        return this.decoratee.deleteMany(ids);
    }
}

export const FailingReviewSave = ReviewRepository.createDecorator({
    decorator: FailingReviewSaveImpl,
    dependencies: []
});
