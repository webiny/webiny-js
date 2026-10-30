import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AssignmentEntry } from "~/domain/assignment/types.js";
import type { AssignmentPersistenceError } from "~/domain/assignment/errors.js";

export interface ListReviewAssignmentsInput {
    reviewId: string;
}

export interface IListReviewAssignmentsUseCaseErrors {
    persistence: AssignmentPersistenceError;
}

type UseCaseError = IListReviewAssignmentsUseCaseErrors[keyof IListReviewAssignmentsUseCaseErrors];

export interface IListReviewAssignmentsUseCase {
    execute(input: ListReviewAssignmentsInput): Promise<Result<AssignmentEntry[], UseCaseError>>;
}

/**
 * Every assignment-log record of a review, newest first (spec 4.3, D127, R96), each with its
 * user's display name (R251). Internal (D132): the get-review wrappers read it, attach the
 * entries to their steps and redact them with `redactAssignmentRecords`. The names are read with
 * one user list without authorization (a name lookup is not an access decision); a failed read
 * is logged and leaves every name `null`, it never fails the review read.
 */
export const ListReviewAssignmentsUseCase = createAbstraction<IListReviewAssignmentsUseCase>(
    "ListReviewAssignmentsUseCase"
);

export namespace ListReviewAssignmentsUseCase {
    export type Interface = IListReviewAssignmentsUseCase;
    export type Input = ListReviewAssignmentsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<AssignmentEntry[], UseCaseError>>;
}
