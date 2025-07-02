import type { WbListMeta } from "~/types";
import type { ListWbPagesParams, WbPage, WbPagesStorageOperations } from "~/page/page.types";
import type { IListPages } from "./IListPages";

export class ListPages implements IListPages {
    private readonly listOperation: WbPagesStorageOperations["list"];

    constructor(listOperation: WbPagesStorageOperations["list"]) {
        this.listOperation = listOperation;
    }

    async execute(params: ListWbPagesParams): Promise<[WbPage[], WbListMeta]> {
        return await this.listOperation(params);
    }
}
