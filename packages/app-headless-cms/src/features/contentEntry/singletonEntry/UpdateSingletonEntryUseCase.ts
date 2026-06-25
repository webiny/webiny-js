import {
    UpdateSingletonEntryUseCase as UseCaseAbstraction,
    UpdateSingletonEntryGateway
} from "./abstractions.js";
import type { IUpdateSingletonEntryParams } from "./abstractions.js";

class UpdateSingletonEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: UpdateSingletonEntryGateway.Interface) {}

    async execute(params: IUpdateSingletonEntryParams) {
        return this.gateway.execute(params);
    }
}

export const UpdateSingletonEntryUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSingletonEntryUseCaseImpl,
    dependencies: [UpdateSingletonEntryGateway]
});
