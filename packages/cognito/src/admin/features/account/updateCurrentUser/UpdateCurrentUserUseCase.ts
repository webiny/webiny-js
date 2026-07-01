import {
    UpdateCurrentUserUseCase as UseCaseAbstraction,
    UpdateCurrentUserGateway
} from "./abstractions/index.js";

class UpdateCurrentUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: UpdateCurrentUserGateway.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<UseCaseAbstraction.Result> {
        const result = await this.gateway.execute(params);
        return result;
    }
}

export const UpdateCurrentUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateCurrentUserUseCaseImpl,
    dependencies: [UpdateCurrentUserGateway]
});
