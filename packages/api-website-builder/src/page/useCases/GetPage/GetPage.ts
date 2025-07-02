import type { IGetPage } from "./IGetPage";
import type { GetWbPageParams, WbPagesStorageOperations } from "~/page/page.types";

export class GetPage implements IGetPage {
    private readonly getOperation: WbPagesStorageOperations["get"];

    constructor(getOperation: WbPagesStorageOperations["get"]) {
        this.getOperation = getOperation;
    }

    async execute(params: GetWbPageParams) {
        return await this.getOperation(params);
    }
}
