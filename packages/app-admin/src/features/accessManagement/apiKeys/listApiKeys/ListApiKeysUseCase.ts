import {
    ListApiKeysUseCase as UseCaseAbstraction,
    ListApiKeysRepository,
    type IListApiKeysGatewayResult
} from "./abstractions.js";

class ListApiKeysUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListApiKeysRepository.Interface) {}

    async execute(): Promise<IListApiKeysGatewayResult> {
        return this.repository.execute();
    }
}

export const ListApiKeysUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListApiKeysUseCaseImpl,
    dependencies: [ListApiKeysRepository]
});
