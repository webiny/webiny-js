import {
    ListTasksGateway,
    ListTasksUseCase as UseCaseAbstraction,
    type IListTasksInput,
    type IListTasksOutput
} from "./abstractions.js";

class ListTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListTasksGateway.Interface) {}

    async execute(input: IListTasksInput): Promise<IListTasksOutput> {
        return this.gateway.execute(input);
    }
}

export const ListTasksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTasksUseCaseImpl,
    dependencies: [ListTasksGateway]
});
