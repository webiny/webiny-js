import {
    GetCurrentUserUseCase as UseCaseAbstraction,
    GetCurrentUserGateway
} from "./abstractions/index.js";

class GetCurrentUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetCurrentUserGateway.Interface) {}

    async execute(): Promise<UseCaseAbstraction.Result> {
        const result = await this.gateway.execute();
        return result;
    }
}

export const GetCurrentUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetCurrentUserUseCaseImpl,
    dependencies: [GetCurrentUserGateway]
});
