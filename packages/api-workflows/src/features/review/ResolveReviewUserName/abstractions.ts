import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ResolveReviewUserNameInput {
    // The `userId` of one assignment entry.
    userId: string;
}

export interface IResolveReviewUserNameUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IResolveReviewUserNameUseCaseErrors[keyof IResolveReviewUserNameUseCaseErrors];

export interface IResolveReviewUserNameUseCase {
    execute(input: ResolveReviewUserNameInput): Promise<Result<string | null, UseCaseError>>;
}

/*
 * The display name of a user a review screen shows by name, such as a person skipped by
 * assignment (R251). Internal (D132): no permission check of its own, the field resolver of
 * `WorkflowsAssignmentEntry.userDisplayName` runs after the wrappers authorized the read. Only the
 * user lookup runs without authorization, because `GetUserUseCase` needs a users permission; the
 * result is the display name and nothing else. A user that does not exist is `null`.
 */
export const ResolveReviewUserNameUseCase = createAbstraction<IResolveReviewUserNameUseCase>(
    "ResolveReviewUserNameUseCase"
);

export namespace ResolveReviewUserNameUseCase {
    export type Interface = IResolveReviewUserNameUseCase;
    export type Input = ResolveReviewUserNameInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<string | null, UseCaseError>>;
}
