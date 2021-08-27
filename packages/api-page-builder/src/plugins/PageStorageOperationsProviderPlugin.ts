import { Plugin } from "@webiny/plugins";
import { PageStorageOperations, PbContext } from "~/types";

export interface Params {
    context: PbContext;
}

export abstract class PageStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "pb.storageOperationsProvider.pages";

    public abstract provide(params: Params): Promise<PageStorageOperations>;
}
