import { DeleteFolderParams, IDeleteFolderUseCase } from "./IDeleteFolderUseCase";
import { IDeleteFolderRepository } from "./IDeleteFolderRepository";
import { Folder } from "../Folder";

export class DeleteFolderUseCase implements IDeleteFolderUseCase {
    private repository: IDeleteFolderRepository;

    constructor(repository: IDeleteFolderRepository) {
        this.repository = repository;
    }

    async execute(params: DeleteFolderParams) {
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
