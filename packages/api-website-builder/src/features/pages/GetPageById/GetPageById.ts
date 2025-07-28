import type { IGetPageById } from "./IGetPageById";
import type { WbPagesStorageOperations } from "~/context/pages/pages.types";

export class GetPageById implements IGetPageById {
    private readonly getOperation: WbPagesStorageOperations["getById"];

    constructor(getOperation: WbPagesStorageOperations["getById"]) {
        this.getOperation = getOperation;
    }

    async execute(id: string) {
        return await this.getOperation(id);
    }
}
