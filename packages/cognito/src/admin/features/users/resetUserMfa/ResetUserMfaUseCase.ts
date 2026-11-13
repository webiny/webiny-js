import {
    ResetUserMfaGateway,
    ResetUserMfaUseCase as UseCaseAbstraction,
    type IResetUserMfaUseCaseParams
} from "./abstractions/index.js";

class ResetUserMfaUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ResetUserMfaGateway.Interface) {}

    async execute(params: IResetUserMfaUseCaseParams): Promise<boolean> {
        return this.gateway.execute(params);
    }
}

export const ResetUserMfaUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResetUserMfaUseCaseImpl,
    dependencies: [ResetUserMfaGateway]
});
