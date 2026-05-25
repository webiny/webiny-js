import { DeleteTaskGateway, DeleteTaskUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: DeleteTaskGateway.Interface) {}

    async execute(id: string): Promise<boolean> {
        return this.gateway.execute(id);
    }
}

export const DeleteTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteTaskUseCaseImpl,
    dependencies: [DeleteTaskGateway]
});
