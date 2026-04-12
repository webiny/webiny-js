import { SelectPagesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPageSelectedItemsRepository } from "~/features/pages/shared/abstractions.js";

class SelectPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WbPageSelectedItemsRepository.Interface) {}

    async execute(pages: any[]) {
        await this.repository.selectItems(pages);
    }
}

export const SelectPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: SelectPagesUseCaseImpl,
    dependencies: [WbPageSelectedItemsRepository]
});
