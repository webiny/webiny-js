import type { GetFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoFolderLevelPermissionsCrud, FolderLevelPermission } from "~/flp/flp.types.js";

export class GetFlpUseCase implements UseCaseAbstraction.Interface {
    private readonly get: AcoFolderLevelPermissionsCrud["get"];

    constructor(get: AcoFolderLevelPermissionsCrud["get"]) {
        this.get = get;
    }

    async execute(id: string): Promise<FolderLevelPermission | null> {
        return this.get(id);
    }
}
