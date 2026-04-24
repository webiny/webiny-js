import { Result } from "@webiny/feature/api";
import {
    GetFolderHierarchyUseCase as UseCaseAbstraction,
    GetFolderHierarchyRepository
} from "./abstractions.js";
import type {
    GetFolderHierarchyParams,
    GetFolderHierarchyResponse
} from "~/folder/folder.types.js";
import { createImplementation } from "@webiny/di";

class GetFolderHierarchyUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetFolderHierarchyRepository.Interface) {}

    async execute(
        params: GetFolderHierarchyParams
    ): Promise<Result<GetFolderHierarchyResponse, UseCaseAbstraction.Error>> {
        return await this.repository.execute(params);
    }
}

export const GetFolderHierarchyUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetFolderHierarchyUseCaseImpl,
    dependencies: [GetFolderHierarchyRepository]
});
