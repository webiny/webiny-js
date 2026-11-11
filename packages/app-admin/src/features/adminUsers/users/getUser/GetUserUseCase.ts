import {
    GetUserGateway,
    GetUserUseCase as UseCaseAbstraction,
    type IGetUserUseCaseParams,
    type IGetUserUseCaseResult
} from "./abstractions/index.js";

class GetUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetUserGateway.Interface) {}

    async execute(params: IGetUserUseCaseParams): Promise<IGetUserUseCaseResult> {
        return this.gateway.execute(params);
    }
}

export const GetUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetUserUseCaseImpl,
    dependencies: [GetUserGateway]
});
