import { UpdateFolderParams, IUpdateFolderUseCase } from "./IUpdateFolderUseCase";
import { IUpdateFolderRepository } from "./IUpdateFolderRepository";
import { Folder } from "../Folder";

export class UpdateFolderUseCase implements IUpdateFolderUseCase {
    private repository: IUpdateFolderRepository;

    constructor(repository: IUpdateFolderRepository) {
        this.repository = repository;
    }

    async execute(params: UpdateFolderParams) {
        await this.repository.execute(
            Folder.create({
                id: params.id,
                title: params.title,
                slug: params.slug,
                type: params.type,
                parentId: params.parentId,
                permissions: params.permissions
            })
        );
    }
}
