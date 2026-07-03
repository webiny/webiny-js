import {
    ListTeamsUseCase as UseCaseAbstraction,
    ListTeamsRepository,
    type IListTeamsGatewayResult
} from "./abstractions.js";

class ListTeamsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListTeamsRepository.Interface) {}

    async execute(): Promise<IListTeamsGatewayResult> {
        return this.repository.execute();
    }
}

export const ListTeamsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTeamsUseCaseImpl,
    dependencies: [ListTeamsRepository]
});
