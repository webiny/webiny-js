import type { AcoFolderLevelPermissionsCrud } from "~/flp/flp.types.js";
import type { IGetFolderPermission } from "./IGetFolderPermission.js";

export class GetFolderPermission implements IGetFolderPermission {
    private readonly crud: AcoFolderLevelPermissionsCrud["get"];

    constructor(crud: AcoFolderLevelPermissionsCrud["get"]) {
        this.crud = crud;
    }

    public async execute(id: string) {
        return this.crud(id);
    }
}
