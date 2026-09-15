import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type {
    SimpleEntryNotAuthorizedError,
    SimpleEntryNotFoundError
} from "~/features/simpleContentEntries/domain/errors/index.js";
import type { DeleteSimpleEntryRepository } from "./DeleteSimpleEntryRepository.js";

export interface IDeleteSimpleEntryUseCase {
    execute(model: CmsModel, id: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteSimpleEntryUseCaseErrors {
    notAuthorized: SimpleEntryNotAuthorizedError;
    notFound: SimpleEntryNotFoundError;
    repository: DeleteSimpleEntryRepository.Error;
}

type UseCaseError = IDeleteSimpleEntryUseCaseErrors[keyof IDeleteSimpleEntryUseCaseErrors];

/** Permanently delete a simple content entry. There is no bin. */
export const DeleteSimpleEntryUseCase = createAbstraction<IDeleteSimpleEntryUseCase>(
    "Cms/SimpleEntry/DeleteSimpleEntryUseCase"
);

export namespace DeleteSimpleEntryUseCase {
    export type Interface = IDeleteSimpleEntryUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<void, UseCaseError>>;
}
