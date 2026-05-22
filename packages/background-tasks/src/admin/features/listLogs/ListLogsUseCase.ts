import {
    ListLogsGateway,
    ListLogsUseCase as UseCaseAbstraction,
    type IListLogsInput,
    type IListLogsOutput
} from "./abstractions.js";

class ListLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListLogsGateway.Interface) {}

    async execute(input: IListLogsInput): Promise<IListLogsOutput> {
        return this.gateway.execute(input);
    }
}

export const ListLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLogsUseCaseImpl,
    dependencies: [ListLogsGateway]
});
