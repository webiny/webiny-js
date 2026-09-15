import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    ICreateSimpleEntryInput,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type {
    SimpleEntryNotAuthorizedError,
    SimpleEntryValidationError
} from "~/features/simpleContentEntries/domain/errors/index.js";
import type { CreateSimpleEntryRepository } from "./CreateSimpleEntryRepository.js";

export interface ICreateSimpleEntryUseCase {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        input: ICreateSimpleEntryInput<TValues>
    ): Promise<Result<ISimpleCmsEntry<TValues>, UseCaseError>>;
}

export interface ICreateSimpleEntryUseCaseErrors {
    notAuthorized: SimpleEntryNotAuthorizedError;
    validation: SimpleEntryValidationError;
    repository: CreateSimpleEntryRepository.Error;
}

type UseCaseError = ICreateSimpleEntryUseCaseErrors[keyof ICreateSimpleEntryUseCaseErrors];

/** Create a new simple content entry. */
export const CreateSimpleEntryUseCase = createAbstraction<ICreateSimpleEntryUseCase>(
    "Cms/SimpleEntry/CreateSimpleEntryUseCase"
);

export namespace CreateSimpleEntryUseCase {
    export type Interface = ICreateSimpleEntryUseCase;
    export type Input<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateSimpleEntryInput<TValues>;
    export type Error = UseCaseError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<ISimpleCmsEntry<TValues>, UseCaseError>
    >;
}
