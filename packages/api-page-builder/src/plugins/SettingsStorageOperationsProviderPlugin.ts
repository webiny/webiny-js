import { Plugin } from "@webiny/plugins";
import { SettingsStorageOperations, PbContext } from "~/types";

export interface Params {
    context: PbContext;
}

export abstract class SettingsStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "pb.storageOperationsProvider.system";

    public abstract provide(params: Params): Promise<SettingsStorageOperations>;
}
