import {
    ListRedirectsUseCase as UseCaseAbstraction,
    ListRedirectsGateway,
    type ListRedirectsGatewayParams,
    type ListRedirectsGatewayResult
} from "./abstractions.js";

class ListRedirectsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListRedirectsGateway.Interface) {}

    async execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult> {
        return this.gateway.execute(params);
    }
}

export const ListRedirectsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListRedirectsUseCaseImpl,
    dependencies: [ListRedirectsGateway]
});
