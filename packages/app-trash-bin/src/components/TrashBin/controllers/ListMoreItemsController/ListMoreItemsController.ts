import {
    IListItemsUseCase,
    IListMoreItemsController,
    IListMoreItemsUseCase
} from "../../abstractions";

export class ListMoreItemsController implements IListMoreItemsController {
    private listMoreItemsUseCase: IListItemsUseCase;

    constructor(listMoreItemsUseCase: IListMoreItemsUseCase) {
        this.listMoreItemsUseCase = listMoreItemsUseCase;
    }

    async execute() {
        await this.listMoreItemsUseCase.execute();
    }
}
