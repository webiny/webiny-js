import {
    ListRedirectsUseCase as UseCaseAbstraction,
    ListRedirectsRepository,
    type ListRedirectsGatewayParams,
    type ListRedirectsGatewayResult
} from "./abstractions.js";

class ListRedirectsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListRedirectsRepository.Interface) {}

    async execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult> {
        return this.repository.execute(params);
    }
}

export const ListRedirectsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListRedirectsUseCaseImpl,
    dependencies: [ListRedirectsRepository]
});
