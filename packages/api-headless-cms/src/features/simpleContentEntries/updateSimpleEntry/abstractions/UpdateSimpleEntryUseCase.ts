import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    ISimpleCmsEntry,
    IUpdateSimpleEntryInput
} from "~/features/simpleContentEntries/types.js";
import type {
    SimpleEntryNotAuthorizedError,
    SimpleEntryNotFoundError,
    SimpleEntryValidationError
} from "~/features/simpleContentEntries/domain/errors/index.js";
import type { UpdateSimpleEntryRepository } from "./UpdateSimpleEntryRepository.js";

export interface IUpdateSimpleEntryUseCase {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: IUpdateSimpleEntryInput<TValues>
    ): Promise<Result<ISimpleCmsEntry<TValues>, UseCaseError>>;
}

export interface IUpdateSimpleEntryUseCaseErrors {
    notAuthorized: SimpleEntryNotAuthorizedError;
    notFound: SimpleEntryNotFoundError;
    validation: SimpleEntryValidationError;
    repository: UpdateSimpleEntryRepository.Error;
}

type UseCaseError = IUpdateSimpleEntryUseCaseErrors[keyof IUpdateSimpleEntryUseCaseErrors];

/** Update an existing simple content entry. */
export const UpdateSimpleEntryUseCase = createAbstraction<IUpdateSimpleEntryUseCase>(
    "Cms/SimpleEntry/UpdateSimpleEntryUseCase"
);

export namespace UpdateSimpleEntryUseCase {
    export type Interface = IUpdateSimpleEntryUseCase;
    export type Input<TValues extends CmsEntryValues = CmsEntryValues> =
        IUpdateSimpleEntryInput<TValues>;
    export type Error = UseCaseError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<ISimpleCmsEntry<TValues>, UseCaseError>
    >;
}
