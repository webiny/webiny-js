import { GetFolderLevelPermissionUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetFolderLevelPermissionUseCaseImpl implements UseCaseAbstraction.Interface {
    execute() {
        return true;
    }
}

export const GetFolderLevelPermissionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFolderLevelPermissionUseCaseImpl,
    dependencies: []
});
