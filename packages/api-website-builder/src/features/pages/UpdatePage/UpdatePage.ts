import type { IUpdatePage } from "./IUpdatePage";
import type { UpdateWbPageData, WbPagesStorageOperations } from "~/context/pages/pages.types";

export class UpdatePage implements IUpdatePage {
    private readonly updateOperation: WbPagesStorageOperations["update"];

    constructor(updateOperation: WbPagesStorageOperations["update"]) {
        this.updateOperation = updateOperation;
    }

    async execute(id: string, data: UpdateWbPageData) {
        return await this.updateOperation({ id, data });
    }
}
