import {
    GetFolderHierarchyUseCaseParams,
    IGetFolderHierarchyUseCase
} from "./IGetFolderHierarchyUseCase";
import { IGetFolderHierarchyRepository } from "./IGetFolderHierarchyRepository";

export class GetFolderHierarchyUseCase implements IGetFolderHierarchyUseCase {
    private repository: IGetFolderHierarchyRepository;

    constructor(repository: IGetFolderHierarchyRepository) {
        this.repository = repository;
    }

    async execute({ id }: GetFolderHierarchyUseCaseParams) {
        await this.repository.execute({ id });
    }
}
