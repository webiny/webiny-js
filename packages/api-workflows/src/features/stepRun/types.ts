/**
 * The only input of the step run task (R142). The handler reads nothing else from it (R148):
 * the definition, settings and models come from the review snapshot.
 */
export interface StepRunTaskInput {
    reviewId: string;
    stepId: string;
}
