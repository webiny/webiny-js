import {
    ListFolderPermissionsTargetsUseCase as UseCaseAbstraction,
    ListFolderPermissionsTargetsGateway
} from "./abstractions.js";

class ListFolderPermissionsTargetsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListFolderPermissionsTargetsGateway.Interface) {}

    async execute() {
        return this.gateway.execute();
    }
}

export const ListFolderPermissionsTargetsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFolderPermissionsTargetsUseCaseImpl,
    dependencies: [ListFolderPermissionsTargetsGateway]
});
