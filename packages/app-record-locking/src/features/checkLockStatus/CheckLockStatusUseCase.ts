import {
    CheckLockStatusUseCase as UseCaseAbstraction,
    CheckLockStatusGateway,
    type ICheckLockStatusParams
} from "./abstractions.js";

class CheckLockStatusUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: CheckLockStatusGateway.Interface) {}

    async execute(params: ICheckLockStatusParams) {
        return this.gateway.execute(params);
    }
}

export const CheckLockStatusUseCase = UseCaseAbstraction.createImplementation({
    implementation: CheckLockStatusUseCaseImpl,
    dependencies: [CheckLockStatusGateway]
});
