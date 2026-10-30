import { createAbstraction } from "@webiny/feature/admin";

export type ReviewActivitySource = "own" | "remote";

export interface ReviewActivitySignal {
    namespace: string;
    source: ReviewActivitySource;
    // The review the signal is about; `null` when the sender has none (a list action).
    reviewId: string | null;
    // The target revision the signal is about; `null` when the sender has none.
    targetRevisionId: string | null;
}

export type ReviewActivityListener = (signal: ReviewActivitySignal) => void;

export interface IReviewActivity {
    // Returns an idempotent unsubscribe. A listener only receives the signals of its namespaces.
    subscribe(namespaces: string[], listener: ReviewActivityListener): () => void;
    notify(signal: ReviewActivitySignal): void;
}

export const ReviewActivity = createAbstraction<IReviewActivity>("Workflows/ReviewActivity");

export namespace ReviewActivity {
    export type Interface = IReviewActivity;
    export type Signal = ReviewActivitySignal;
    export type Listener = ReviewActivityListener;
}
