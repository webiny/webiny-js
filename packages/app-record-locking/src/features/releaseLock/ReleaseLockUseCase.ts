import {
    ReleaseLockUseCase as UseCaseAbstraction,
    ReleaseLockGateway,
    type IReleaseLockParams
} from "./abstractions.js";

class ReleaseLockUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ReleaseLockGateway.Interface) {}

    async execute(params: IReleaseLockParams) {
        return this.gateway.execute(params);
    }
}

export const ReleaseLockUseCase = UseCaseAbstraction.createImplementation({
    implementation: ReleaseLockUseCaseImpl,
    dependencies: [ReleaseLockGateway]
});
