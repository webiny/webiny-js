import type { IMovePage } from "./IMovePage";
import type { MoveWbPageParams, WbPage, WbPagesStorageOperations } from "~/page/page.types";

export class MovePage implements IMovePage {
    private readonly moveOperation: WbPagesStorageOperations["move"];

    constructor(moveOperation: WbPagesStorageOperations["move"]) {
        this.moveOperation = moveOperation;
    }

    async execute(params: MoveWbPageParams): Promise<WbPage> {
        return await this.moveOperation(params);
    }
}
