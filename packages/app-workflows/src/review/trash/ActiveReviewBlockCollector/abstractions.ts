import { createAbstraction } from "@webiny/feature/admin";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";

export interface IActiveReviewBlockCollector {
    /*
     * Opens a collect run for the target ids of one bulk run and returns its id.
     */
    begin(targetIds: string[]): string;
    /*
     * True only while an active run owns a target of one of the refusal's reviews.
     */
    collects(data: ActiveReviewOnTrashData): boolean;
    /*
     * Stores the refusal, reduced to the reviews each matching active run owns.
     */
    add(data: ActiveReviewOnTrashData): void;
    /*
     * Returns what the run collected and forgets the run.
     */
    drain(runId: string): ActiveReviewOnTrashData[];
    /*
     * Stops the run from collecting; its data stays until it is drained.
     */
    end(runId: string): void;
}

export const ActiveReviewBlockCollector = createAbstraction<IActiveReviewBlockCollector>(
    "Workflows/ActiveReviewBlockCollector"
);

export namespace ActiveReviewBlockCollector {
    export type Interface = IActiveReviewBlockCollector;
}
