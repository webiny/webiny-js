import {
    CreateUserGateway,
    CreateUserUseCase as UseCaseAbstraction,
    type ICreateUserUseCaseParams,
    type ICreateUserUseCaseResult
} from "./abstractions/index.js";

class CreateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: CreateUserGateway.Interface) {}

    async execute(params: ICreateUserUseCaseParams): Promise<ICreateUserUseCaseResult> {
        return this.gateway.execute(params);
    }
}

export const CreateUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateUserUseCaseImpl,
    dependencies: [CreateUserGateway]
});
