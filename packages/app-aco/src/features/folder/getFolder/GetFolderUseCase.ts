import { GetFolderParams, IGetFolderUseCase } from "./IGetFolderUseCase";
import { IGetFolderRepository } from "./IGetFolderRepository";

export class GetFolderUseCase implements IGetFolderUseCase {
    private repository: IGetFolderRepository;

    constructor(repository: IGetFolderRepository) {
        this.repository = repository;
    }

    async execute(params: GetFolderParams) {
        await this.repository.execute(params.id);
    }
}
