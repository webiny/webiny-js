import {
    DuplicatePageUseCase as UseCaseAbstraction,
    DuplicatePageRepository
} from "./abstractions.js";
import { Page } from "~/domain/Page/Page.js";

class DuplicatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DuplicatePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }));
    }
}

export const DuplicatePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: DuplicatePageUseCaseImpl,
    dependencies: [DuplicatePageRepository]
});
