import { Plugin } from "@webiny/plugins";
import { MenuStorageOperations, PbContext } from "~/types";

export interface Params {
    context: PbContext;
}

export abstract class MenuStorageOperationsProviderPlugin extends Plugin {
    public static readonly type = "pb.storageOperationsProvider.menu";

    public abstract provide(params: Params): Promise<MenuStorageOperations>;
}
