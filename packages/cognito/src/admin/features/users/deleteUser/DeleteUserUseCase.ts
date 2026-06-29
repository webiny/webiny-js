import {
    DeleteUserGateway,
    DeleteUserUseCase as UseCaseAbstraction,
    type IDeleteUserUseCaseParams
} from "./abstractions/index.js";

class DeleteUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: DeleteUserGateway.Interface) {}

    async execute(params: IDeleteUserUseCaseParams): Promise<boolean> {
        return this.gateway.execute(params);
    }
}

export const DeleteUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteUserUseCaseImpl,
    dependencies: [DeleteUserGateway]
});
