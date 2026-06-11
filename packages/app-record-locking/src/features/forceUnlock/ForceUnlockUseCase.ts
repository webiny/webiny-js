import {
    ForceUnlockUseCase as UseCaseAbstraction,
    ForceUnlockGateway,
    type IForceUnlockParams
} from "./abstractions.js";

class ForceUnlockUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ForceUnlockGateway.Interface) {}

    async execute(params: IForceUnlockParams) {
        return this.gateway.execute(params);
    }
}

export const ForceUnlockUseCase = UseCaseAbstraction.createImplementation({
    implementation: ForceUnlockUseCaseImpl,
    dependencies: [ForceUnlockGateway]
});
