import { Plugin } from "@webiny/plugins";
import { SystemStorageOperations, PbContext } from "~/types";

export interface Params {
    context: PbContext;
}

export abstract class SystemStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "pb.storageOperationsProvider.system";

    public abstract provide(params: Params): Promise<SystemStorageOperations>;
}
