import { createAbstraction } from "@webiny/feature/api";

export interface IReviewListLimits {
    /** Repository rows per page. Keep it constant: a cursor's `skip` counts rows of one page. */
    pageSize: number;
    /** Rows one list call examines at most (D76, A41). */
    maxScan: number;
}

/** Tunable page size and scan cap of the review lists; tests register smaller ones. */
export const ReviewListLimits = createAbstraction<IReviewListLimits>("ReviewListLimits");

export namespace ReviewListLimits {
    export type Interface = IReviewListLimits;
}
