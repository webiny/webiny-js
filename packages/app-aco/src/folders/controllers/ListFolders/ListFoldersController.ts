import { IListFoldersController } from "./IListFoldersController";
import { IListFoldersUseCase } from "~/folders/useCases";

export class ListFoldersController implements IListFoldersController {
    private useCase: IListFoldersUseCase;

    constructor(useCase: IListFoldersUseCase) {
        this.useCase = useCase;
    }

    async execute(type: string): Promise<void> {
        await this.useCase.execute({ type });
    }
}
