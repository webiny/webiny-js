import type { ICreatePage } from "./ICreatePage";
import type { CreateWbPageData, WbPagesStorageOperations } from "~/page/page.types";

export class CreatePage implements ICreatePage {
    private readonly createOperation: WbPagesStorageOperations["create"];

    constructor(createOperation: WbPagesStorageOperations["create"]) {
        this.createOperation = createOperation;
    }

    async execute(data: CreateWbPageData) {
        return await this.createOperation({ data });
    }
}
