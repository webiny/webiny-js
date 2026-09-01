import {
    AcquireLockUseCase as UseCaseAbstraction,
    AcquireLockGateway,
    type IAcquireLockParams
} from "./abstractions.js";

class AcquireLockUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: AcquireLockGateway.Interface) {}

    async execute(params: IAcquireLockParams) {
        return this.gateway.execute(params);
    }
}

export const AcquireLockUseCase = UseCaseAbstraction.createImplementation({
    implementation: AcquireLockUseCaseImpl,
    dependencies: [AcquireLockGateway]
});
