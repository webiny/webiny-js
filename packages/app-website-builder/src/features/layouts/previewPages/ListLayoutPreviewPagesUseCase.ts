import { ListPagesUseCase } from "~/features/pages/listPages/abstractions.js";
import { ListLayoutPreviewPagesUseCase as UseCaseAbstraction } from "./abstractions.js";

// Enough to pick from: the rest are found by searching.
const PAGES_LIMIT = 50;

class ListLayoutPreviewPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private listPages: ListPagesUseCase.Interface) {}

    async execute(search?: string) {
        const { data } = await this.listPages.execute({
            limit: PAGES_LIMIT,
            sort: ["savedOn_DESC"],
            search: search?.trim() || undefined
        });

        return data
            .map(page => ({
                id: page.id,
                title: String(page.properties?.title ?? ""),
                path: String(page.properties?.path ?? "")
            }))
            .sort((a, b) => a.title.localeCompare(b.title));
    }
}

export const ListLayoutPreviewPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLayoutPreviewPagesUseCaseImpl,
    dependencies: [ListPagesUseCase]
});
