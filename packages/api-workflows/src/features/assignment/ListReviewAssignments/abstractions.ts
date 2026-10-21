import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AssignmentRecord } from "~/domain/assignment/types.js";
import type { AssignmentPersistenceError } from "~/domain/assignment/errors.js";

export interface ListReviewAssignmentsInput {
    reviewId: string;
}

export interface IListReviewAssignmentsUseCaseErrors {
    persistence: AssignmentPersistenceError;
}

type UseCaseError = IListReviewAssignmentsUseCaseErrors[keyof IListReviewAssignmentsUseCaseErrors];

export interface IListReviewAssignmentsUseCase {
    execute(input: ListReviewAssignmentsInput): Promise<Result<AssignmentRecord[], UseCaseError>>;
}

/**
 * Every assignment-log record of a review, newest first (spec 4.3, D127, R96). Internal (D132):
 * the get-review wrappers read it, attach the records to their steps and redact them with
 * `redactAssignmentRecords`.
 */
export const ListReviewAssignmentsUseCase = createAbstraction<IListReviewAssignmentsUseCase>(
    "ListReviewAssignmentsUseCase"
);

export namespace ListReviewAssignmentsUseCase {
    export type Interface = IListReviewAssignmentsUseCase;
    export type Input = ListReviewAssignmentsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<AssignmentRecord[], UseCaseError>>;
}
