import { ListVisibleTaskDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";

class ListVisibleTaskDefinitionsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
    ) {}

    public execute() {
        return this.listTaskDefinitions.execute().filter(definition => !definition.isPrivate);
    }
}

export const ListVisibleTaskDefinitionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListVisibleTaskDefinitionsUseCaseImpl,
    dependencies: [ListTaskDefinitionsUseCase]
});
