import { Plugin } from "@webiny/plugins";
import { CategoryStorageOperations, PbContext } from "~/types";

export interface Params {
    context: PbContext;
}

export abstract class CategoryStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "pb.storageOperationsProvider.category";

    public abstract provide(params: Params): Promise<CategoryStorageOperations>;
}
