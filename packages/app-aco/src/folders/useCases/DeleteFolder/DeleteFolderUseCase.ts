import { DeleteFolderParams, IDeleteFolderUseCase } from "./IDeleteFolderUseCase";
import { IDeleteFolderRepository } from "../../repositories/DeleteFolder";

export class DeleteFolderUseCase implements IDeleteFolderUseCase {
    private repository: IDeleteFolderRepository;

    constructor(repository: IDeleteFolderRepository) {
        this.repository = repository;
    }

    async execute(params: DeleteFolderParams) {
        await this.repository.execute(params.id);
    }
}
