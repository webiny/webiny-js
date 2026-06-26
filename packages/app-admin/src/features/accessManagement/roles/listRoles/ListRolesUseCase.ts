import {
    ListRolesUseCase as UseCaseAbstraction,
    ListRolesRepository,
    type IListRolesGatewayResult
} from "./abstractions.js";

class ListRolesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListRolesRepository.Interface) {}

    async execute(): Promise<IListRolesGatewayResult> {
        return this.repository.execute();
    }
}

export const ListRolesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListRolesUseCaseImpl,
    dependencies: [ListRolesRepository]
});
