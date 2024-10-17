import { IGetDescendantFoldersRepository } from "./IGetDescendantFoldersRepository";
import {
    GetDescendantFoldersParams,
    IGetDescendantFoldersUseCase
} from "./IGetDescendantFoldersUseCase";

export class GetDescendantFoldersUseCase implements IGetDescendantFoldersUseCase {
    private repository: IGetDescendantFoldersRepository;

    constructor(repository: IGetDescendantFoldersRepository) {
        this.repository = repository;
    }

    execute(params: GetDescendantFoldersParams) {
        const folders = this.repository.execute(params.id);

        return folders.map(folder => ({
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            type: folder.type,
            parentId: folder.parentId
        }));
    }
}
