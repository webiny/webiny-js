import { IDeleteFolderController } from "./IDeleteFolderController";
import { IDeleteFolderUseCase } from "~/folders/useCases";
import { FolderItem } from "~/types";

export class DeleteFolderController implements IDeleteFolderController {
    private useCase: IDeleteFolderUseCase;

    constructor(useCase: IDeleteFolderUseCase) {
        this.useCase = useCase;
    }

    async execute(folder: FolderItem) {
        await this.useCase.execute({ id: folder.id });
    }
}
