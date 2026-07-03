import {
    UpdateUserGateway,
    UpdateUserUseCase as UseCaseAbstraction,
    type IUpdateUserUseCaseParams,
    type IUpdateUserUseCaseResult
} from "./abstractions/index.js";

class UpdateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: UpdateUserGateway.Interface) {}

    async execute(params: IUpdateUserUseCaseParams): Promise<IUpdateUserUseCaseResult> {
        return this.gateway.execute(params);
    }
}

export const UpdateUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateUserUseCaseImpl,
    dependencies: [UpdateUserGateway]
});
