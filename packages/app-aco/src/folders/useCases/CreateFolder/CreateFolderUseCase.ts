import { CreateFolderParams, ICreateFolderUseCase } from "./ICreateFolderUseCase";
import { Folder } from "~/folders/domain";
import { ICreateFolderRepository } from "~/folders/repositories";

export class CreateFolderUseCase implements ICreateFolderUseCase {
    private repository: ICreateFolderRepository;

    constructor(repository: ICreateFolderRepository) {
        this.repository = repository;
    }

    async execute(params: CreateFolderParams) {
        await this.repository.execute(
            Folder.create({
                title: params.title,
                slug: params.slug,
                type: params.type,
                parentId: params.parentId,
                permissions: params.permissions
            })
        );
    }
}
