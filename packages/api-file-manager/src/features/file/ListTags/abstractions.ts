import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { type FilePersistenceError, FileNotAuthorizedError } from "~/domain/file/errors.js";

export interface ListTagsInput {
    where?: Record<string, any>;
    after?: string | null;
    limit?: number;
}

export interface TagItem {
    tag: string;
    count: number;
}

/**
 * ListTags repository interface
 */
export interface IListTagsRepository {
    execute(input: ListTagsInput): Promise<Result<TagItem[], RepositoryError>>;
}

export interface IListTagsRepositoryErrors {
    persistence: FilePersistenceError;
}

type RepositoryError = IListTagsRepositoryErrors[keyof IListTagsRepositoryErrors];

export const ListTagsRepository = createAbstraction<IListTagsRepository>("ListTagsRepository");

export namespace ListTagsRepository {
    export type Interface = IListTagsRepository;
    export type Error = RepositoryError;
}

/**
 * ListTags use case interface
 */
export interface IListTagsUseCase {
    execute(input: ListTagsInput): Promise<Result<TagItem[], UseCaseError>>;
}

export interface IListTagsUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    persistence: FilePersistenceError;
}

type UseCaseError = IListTagsUseCaseErrors[keyof IListTagsUseCaseErrors];

export const ListTagsUseCase = createAbstraction<IListTagsUseCase>("ListTagsUseCase");

export namespace ListTagsUseCase {
    export type Interface = IListTagsUseCase;
    export type Error = UseCaseError;
}
