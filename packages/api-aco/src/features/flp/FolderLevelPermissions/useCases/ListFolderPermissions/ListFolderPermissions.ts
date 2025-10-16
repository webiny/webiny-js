import type { IListFolderPermissions } from "./IListFolderPermissions.js";
import type { AcoFolderLevelPermissionsCrud, ListFlpsParams } from "~/flp/flp.types.js";

export class ListFolderPermissions implements IListFolderPermissions {
    private readonly crud: AcoFolderLevelPermissionsCrud["list"];

    constructor(crud: AcoFolderLevelPermissionsCrud["list"]) {
        this.crud = crud;
    }

    async execute(params: ListFlpsParams) {
        return this.crud(params);
    }
}
