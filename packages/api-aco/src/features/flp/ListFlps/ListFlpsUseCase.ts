import type { ListFlpsUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoFolderLevelPermissionsCrud, ListFlpsParams } from "~/flp/flp.types.js";

export class ListFlpsUseCase implements UseCaseAbstraction.Interface {
    private readonly list: AcoFolderLevelPermissionsCrud["list"];

    constructor(list: AcoFolderLevelPermissionsCrud["list"]) {
        this.list = list;
    }

    async execute(params: ListFlpsParams) {
        return this.list(params);
    }
}
