import { GetFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderPermissionsRepository } from "~/features/flp/FolderPermissionsRepository/index.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";

class GetFlpUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: FolderPermissionsRepository.Interface) {}

    async execute(id: string): Promise<FolderLevelPermission | null> {
        return this.repository.get(id);
    }
}

export const GetFlpUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFlpUseCaseImpl,
    dependencies: [FolderPermissionsRepository]
});
