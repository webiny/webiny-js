import type { IListRedirects, ListWbRedirectsParams, WbListMeta } from "./IListRedirects";
import { WbRedirect, WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";

export class ListRedirects implements IListRedirects {
    private readonly listOperation: WbRedirectsStorageOperations["list"];

    constructor(listOperation: WbRedirectsStorageOperations["list"]) {
        this.listOperation = listOperation;
    }

    async execute(params: ListWbRedirectsParams): Promise<[WbRedirect[], WbListMeta]> {
        return await this.listOperation(params);
    }
}
