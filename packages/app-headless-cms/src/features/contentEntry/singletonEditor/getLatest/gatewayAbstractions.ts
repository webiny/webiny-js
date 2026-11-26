import { createAbstraction } from "@webiny/feature/admin";
import type { Result } from "@webiny/feature/api";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { CmsEntryError } from "~/features/contentEntry/CmsEntryError.js";

export interface IGetLatestSingletonEntryGateway {
    execute(model: CmsModel): Promise<Result<CmsContentEntry, CmsEntryError>>;
}

export const GetLatestSingletonEntryGateway = createAbstraction<IGetLatestSingletonEntryGateway>(
    "GetLatestSingletonEntryGateway"
);

export namespace GetLatestSingletonEntryGateway {
    export type Interface = IGetLatestSingletonEntryGateway;
}
