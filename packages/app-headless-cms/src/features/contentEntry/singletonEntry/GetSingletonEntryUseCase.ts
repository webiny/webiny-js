import {
    GetSingletonEntryUseCase as UseCaseAbstraction,
    GetSingletonEntryGateway
} from "./abstractions.js";
import type { IGetSingletonEntryParams } from "./abstractions.js";

class GetSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: GetSingletonEntryGateway.Interface) {}

    async execute(params: IGetSingletonEntryParams) {
        return this.gateway.execute(params);
    }
}

export const GetSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSingletonEntryUseCaseImpl,
    dependencies: [GetSingletonEntryGateway]
});
