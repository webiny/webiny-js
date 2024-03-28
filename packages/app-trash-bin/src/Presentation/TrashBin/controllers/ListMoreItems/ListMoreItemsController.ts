import { IListItemsUseCase, IListMoreItemsUseCase } from "~/Domain";
import { IListMoreItemsController } from "./IListMoreItemsController";

export class ListMoreItemsController implements IListMoreItemsController {
    private listMoreItemsUseCase: IListItemsUseCase;

    constructor(listMoreItemsUseCase: IListMoreItemsUseCase) {
        this.listMoreItemsUseCase = listMoreItemsUseCase;
    }

    async execute() {
        await this.listMoreItemsUseCase.execute();
    }
}
