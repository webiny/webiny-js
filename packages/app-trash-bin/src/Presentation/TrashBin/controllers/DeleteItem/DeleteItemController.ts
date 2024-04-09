import { IDeleteItemUseCase } from "~/Domain";
import { IDeleteItemController } from "./IDeleteItemController";

export class DeleteItemController implements IDeleteItemController {
    private readonly useCaseFactory: () => IDeleteItemUseCase;

    constructor(useCaseFactory: () => IDeleteItemUseCase) {
        this.useCaseFactory = useCaseFactory;
    }

    async execute(id: string) {
        const deleteItemUseCase = this.useCaseFactory();
        await deleteItemUseCase.execute(id);
    }
}
