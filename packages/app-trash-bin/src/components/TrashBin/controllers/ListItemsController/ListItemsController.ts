import { IListItemsController, IListItemsUseCase } from "../../abstractions";

export class ListItemsController implements IListItemsController {
    private listItemsUseCase: IListItemsUseCase;

    constructor(listItemsUseCase: IListItemsUseCase) {
        this.listItemsUseCase = listItemsUseCase;
    }

    async execute() {
        await this.listItemsUseCase.execute();
    }
}
