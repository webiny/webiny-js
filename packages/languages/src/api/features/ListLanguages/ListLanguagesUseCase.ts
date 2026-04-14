import { createImplementation } from "@webiny/feature/api";
import {
    ListLanguagesUseCase as UseCaseAbstraction,
    ListLanguagesRepository
} from "./abstractions.js";

class ListLanguagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListLanguagesRepository.Interface) {}

    async execute(): UseCaseAbstraction.Return {
        return this.repository.execute();
    }
}

export const ListLanguagesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListLanguagesUseCaseImpl,
    dependencies: [ListLanguagesRepository]
});
