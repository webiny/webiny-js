import { FilterPagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";

class FilterPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        const cleanFilters = Object.fromEntries(
            Object.entries(params.filters).filter(([, value]) => value !== undefined)
        );

        if (Object.values(cleanFilters).length === 0) {
            await this.repository.loadPages({
                where: { location: { folderId: params.folderIds[0] ?? ROOT_FOLDER } }
            });
            return;
        }

        let where = {};
        if (params.folderIds.length > 0) {
            where = { location: { folderId_in: params.folderIds } };
        }

        await this.repository.filterPages(cleanFilters, where);
    }
}

export const FilterPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: FilterPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
