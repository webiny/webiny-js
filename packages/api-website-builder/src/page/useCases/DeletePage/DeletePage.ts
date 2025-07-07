import type { IDeletePage } from "./IDeletePage";
import type { DeleteWbPageParams, WbPagesStorageOperations } from "~/page/page.types";

export class DeletePage implements IDeletePage {
    private readonly deleteOperation: WbPagesStorageOperations["delete"];

    constructor(deleteOperation: WbPagesStorageOperations["delete"]) {
        this.deleteOperation = deleteOperation;
    }

    async execute(params: DeleteWbPageParams) {
        await this.deleteOperation(params);
    }
}
