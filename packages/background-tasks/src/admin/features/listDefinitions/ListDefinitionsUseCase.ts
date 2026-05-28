import {
    ListDefinitionsGateway,
    ListDefinitionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

class ListDefinitionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListDefinitionsGateway.Interface) {}

    async execute(): Promise<TaskDefinition[]> {
        return this.gateway.execute();
    }
}

export const ListDefinitionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListDefinitionsUseCaseImpl,
    dependencies: [ListDefinitionsGateway]
});
