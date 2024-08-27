import { IGetFolderRepository } from "~/folders/repositories";
import { GetFolderParams, IGetFolderUseCase } from "./IGetFolderUseCase";

export class GetFolderUseCase implements IGetFolderUseCase {
    private repository: IGetFolderRepository;

    constructor(repository: IGetFolderRepository) {
        this.repository = repository;
    }

    async execute(params: GetFolderParams) {
        await this.repository.execute(params.id);
    }
}
