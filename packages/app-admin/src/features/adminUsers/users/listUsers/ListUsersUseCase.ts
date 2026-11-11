import {
    ListUsersGateway,
    ListUsersUseCase as UseCaseAbstraction,
    type IListUsersUseCaseResult
} from "./abstractions/index.js";

class ListUsersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListUsersGateway.Interface) {}

    async execute(): Promise<IListUsersUseCaseResult[]> {
        return this.gateway.execute();
    }
}

export const ListUsersUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListUsersUseCaseImpl,
    dependencies: [ListUsersGateway]
});
