import type { Container } from "@webiny/di";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";

export interface ListTargetReviewsConcurrency {
    /** Calls running right now. */
    current: number;
    /** The most calls that ran at the same time. */
    max: number;
}

/** What the probe measured. Reset it in `beforeEach`. */
export const listTargetReviewsConcurrency: ListTargetReviewsConcurrency = { current: 0, max: 0 };

export const resetListTargetReviewsConcurrency = (): void => {
    listTargetReviewsConcurrency.current = 0;
    listTargetReviewsConcurrency.max = 0;
};

class ConcurrencyProbeListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(input: ListTargetReviewsUseCase.Input): ListTargetReviewsUseCase.Return {
        listTargetReviewsConcurrency.current += 1;
        listTargetReviewsConcurrency.max = Math.max(
            listTargetReviewsConcurrency.max,
            listTargetReviewsConcurrency.current
        );
        try {
            return await this.decoratee.execute(input);
        } finally {
            listTargetReviewsConcurrency.current -= 1;
        }
    }
}

/** Measures how many target review lists run at once (`legacyPlugins`). */
export const probeListTargetReviewsConcurrency = (container: Container) => {
    container.registerDecorator(
        ListTargetReviewsUseCase.createDecorator({
            decorator: ConcurrencyProbeListTargetReviews,
            dependencies: []
        })
    );
};
