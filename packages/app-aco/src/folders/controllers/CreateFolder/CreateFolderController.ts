import { ICreateFolderController } from "./ICreateFolderController";
import { ICreateFolderUseCase } from "~/folders/useCases";
import { FolderItem } from "~/types";

export class CreateFolderController implements ICreateFolderController {
    private useCase: ICreateFolderUseCase;

    constructor(useCase: ICreateFolderUseCase) {
        this.useCase = useCase;
    }

    async execute(folder: FolderItem, type: string) {
        console.log("type", type);
        await this.useCase.execute({
            type: type,
            title: folder.title,
            slug: folder.slug,
            parentId: folder.parentId,
            permissions: folder.permissions
        });
    }
}
