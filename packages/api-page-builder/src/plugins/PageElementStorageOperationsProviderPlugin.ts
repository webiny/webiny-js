import { Plugin } from "@webiny/plugins";
import { PageElementStorageOperations, PbContext } from "~/types";

export interface Params {
    context: PbContext;
}

export abstract class PageElementStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "pb.storageOperationsProvider.pageElements";

    public abstract provide(params: Params): Promise<PageElementStorageOperations>;
}
