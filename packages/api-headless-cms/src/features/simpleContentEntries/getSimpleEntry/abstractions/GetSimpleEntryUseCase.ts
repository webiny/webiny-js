import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    IGetSimpleEntryParams,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";
import type { SimpleEntryNotAuthorizedError } from "~/features/simpleContentEntries/domain/errors/index.js";
import type { GetSimpleEntryRepository } from "./GetSimpleEntryRepository.js";

export interface IGetSimpleEntryUseCase {
    execute<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: IGetSimpleEntryParams
    ): Promise<Result<ISimpleCmsEntry<TValues>, UseCaseError>>;
}

export interface IGetSimpleEntryUseCaseErrors {
    notAuthorized: SimpleEntryNotAuthorizedError;
    repository: GetSimpleEntryRepository.Error;
}

type UseCaseError = IGetSimpleEntryUseCaseErrors[keyof IGetSimpleEntryUseCaseErrors];

/** Read a single simple content entry. Absence is a NotFoundError, never null. */
export const GetSimpleEntryUseCase = createAbstraction<IGetSimpleEntryUseCase>(
    "Cms/SimpleEntry/GetSimpleEntryUseCase"
);

export namespace GetSimpleEntryUseCase {
    export type Interface = IGetSimpleEntryUseCase;
    export type Params = IGetSimpleEntryParams;
    export type Error = UseCaseError;
    export type Return<TValues extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<ISimpleCmsEntry<TValues>, UseCaseError>
    >;
}
