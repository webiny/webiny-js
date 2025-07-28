import type { IListPages, ListWbPagesParams, WbListMeta } from "./IListPages";
import { WbPage, WbPagesStorageOperations } from "~/context/pages/pages.types";

export class ListPages implements IListPages {
    private readonly listOperation: WbPagesStorageOperations["list"];

    constructor(listOperation: WbPagesStorageOperations["list"]) {
        this.listOperation = listOperation;
    }

    async execute(params: ListWbPagesParams): Promise<[WbPage[], WbListMeta]> {
        return await this.listOperation(params);
    }
}
