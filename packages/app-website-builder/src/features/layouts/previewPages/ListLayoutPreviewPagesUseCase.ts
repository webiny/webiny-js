import {
    LayoutPreviewPagesGateway,
    ListLayoutPreviewPagesUseCase as UseCaseAbstraction
} from "./abstractions.js";

class ListLayoutPreviewPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: LayoutPreviewPagesGateway.Interface) {}

    async execute(language: string | null) {
        const pages = await this.gateway.listPages();
        const filtered = language ? pages.filter(page => page.language === language) : pages;

        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }
}

export const ListLayoutPreviewPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLayoutPreviewPagesUseCaseImpl,
    dependencies: [LayoutPreviewPagesGateway]
});
