import { ListPageGlobalComponentsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListGlobalComponentsUseCase } from "~/features/globals/ListGlobalComponents/abstractions.js";

class ListPageGlobalComponentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listGlobalComponents: ListGlobalComponentsUseCase.Interface) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        return this.listGlobalComponents.execute({ language: params.language, fallback: true });
    }
}

export const ListPageGlobalComponentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListPageGlobalComponentsUseCaseImpl,
    dependencies: [ListGlobalComponentsUseCase]
});
