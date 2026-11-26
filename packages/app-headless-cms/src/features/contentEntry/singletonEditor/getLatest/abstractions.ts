import { createAbstraction } from "@webiny/feature/admin";
import type { Result } from "@webiny/feature/api";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { CmsEntryError } from "~/features/contentEntry/CmsEntryError.js";

export interface IGetLatestSingletonEntryUseCase {
    execute(model: CmsModel): Promise<Result<CmsContentEntry, CmsEntryError>>;
}

export const GetLatestSingletonEntryUseCase = createAbstraction<IGetLatestSingletonEntryUseCase>(
    "GetLatestSingletonEntryUseCase"
);

export namespace GetLatestSingletonEntryUseCase {
    export type Interface = IGetLatestSingletonEntryUseCase;
}
