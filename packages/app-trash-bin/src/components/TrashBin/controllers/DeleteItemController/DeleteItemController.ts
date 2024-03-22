import { IDeleteItemController, IDeleteItemUseCase } from "~/components/TrashBin/abstractions";

export class DeleteItemController implements IDeleteItemController {
    private deleteItemUseCase: IDeleteItemUseCase;

    constructor(deleteItemUseCase: IDeleteItemUseCase) {
        this.deleteItemUseCase = deleteItemUseCase;
    }

    async execute(id: string) {
        await this.deleteItemUseCase.execute(id);
    }
}
