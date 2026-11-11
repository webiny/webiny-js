import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";

/**
 * Review ids `getMany` leaves out, as if deleted after the list index returned them (R18).
 * Clear it per test.
 */
export const goneAfterList = new Set<string>();

export const resetGoneAfterList = (): void => {
    goneAfterList.clear();
};

class GoneAfterListReviewsImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public async getMany(ids: string[]): ReturnType<ReviewRepository.Interface["getMany"]> {
        const result = await this.decoratee.getMany(ids);
        if (result.isFail()) {
            return result;
        }
        const kept = result.value.filter(review => !goneAfterList.has(review.id));
        return Result.ok(kept);
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

    public create(review: ReviewData): ReturnType<ReviewRepository.Interface["create"]> {
        return this.decoratee.create(review);
    }

    public update(review: ReviewData): ReturnType<ReviewRepository.Interface["update"]> {
        return this.decoratee.update(review);
    }

    public deleteMany(ids: string[]): ReturnType<ReviewRepository.Interface["deleteMany"]> {
        return this.decoratee.deleteMany(ids);
    }
}

export const GoneAfterListReviews = ReviewRepository.createDecorator({
    decorator: GoneAfterListReviewsImpl,
    dependencies: []
});
