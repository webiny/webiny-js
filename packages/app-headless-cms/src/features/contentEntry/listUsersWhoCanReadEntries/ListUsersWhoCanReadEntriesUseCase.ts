import {
    ListUsersWhoCanReadEntriesUseCase as UseCaseAbstraction,
    ListUsersWhoCanReadEntriesGateway
} from "./abstractions.js";

class ListUsersWhoCanReadEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListUsersWhoCanReadEntriesGateway.Interface) {}

    async execute(modelId: string) {
        return this.gateway.execute(modelId);
    }
}

export const ListUsersWhoCanReadEntriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListUsersWhoCanReadEntriesUseCaseImpl,
    dependencies: [ListUsersWhoCanReadEntriesGateway]
});
