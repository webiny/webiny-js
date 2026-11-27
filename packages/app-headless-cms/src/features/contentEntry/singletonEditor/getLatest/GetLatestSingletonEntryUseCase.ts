import type { CmsModel } from "~/types.js";
import { GetLatestSingletonEntryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLatestSingletonEntryGateway } from "./gatewayAbstractions.js";

class GetLatestSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: GetLatestSingletonEntryGateway.Interface) {}

    async execute(model: CmsModel) {
        return this.gateway.execute(model);
    }
}

export const GetLatestSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLatestSingletonEntryUseCaseImpl,
    dependencies: [GetLatestSingletonEntryGateway]
});
