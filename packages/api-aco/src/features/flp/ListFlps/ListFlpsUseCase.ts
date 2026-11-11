import { ListFlpsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderPermissionsRepository } from "~/features/flp/FolderPermissionsRepository/index.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";

class ListFlpsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: FolderPermissionsRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<FolderLevelPermission[]> {
        return this.repository.list(params);
    }
}

export const ListFlpsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFlpsUseCaseImpl,
    dependencies: [FolderPermissionsRepository]
});
