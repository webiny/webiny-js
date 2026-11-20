import {
    ListGlobalComponentsGateway,
    ListGlobalComponentsUseCase as UseCaseAbstraction
} from "./abstractions.js";

class ListGlobalComponentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListGlobalComponentsGateway.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.gateway.execute(params);
    }
}

export const ListGlobalComponentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListGlobalComponentsUseCaseImpl,
    dependencies: [ListGlobalComponentsGateway]
});
