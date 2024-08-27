import { IUpdateFolderController } from "./IUpdateFolderController";
import { IUpdateFolderUseCase } from "~/folders/useCases";
import { FolderItem } from "~/types";

export class UpdateFolderController implements IUpdateFolderController {
    private useCase: IUpdateFolderUseCase;

    constructor(useCase: IUpdateFolderUseCase) {
        this.useCase = useCase;
    }

    async execute(folder: FolderItem) {
        await this.useCase.execute({
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            type: folder.type,
            parentId: folder.parentId,
            permissions: folder.permissions
        });
    }
}
