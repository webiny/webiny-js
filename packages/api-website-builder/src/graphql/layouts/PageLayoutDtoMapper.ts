import { GetPageLayoutUseCase } from "~/features/layouts/GetPageLayout/index.js";
import { PageLayoutDtoMapper as MapperAbstraction } from "./abstractions.js";
import type { Layout } from "~/domain/layout/abstractions.js";

class PageLayoutDtoMapperImpl implements MapperAbstraction.Interface {
    constructor(private getPageLayout: GetPageLayoutUseCase.Interface) {}

    async toApi(page: Record<string, any> | null | undefined): Promise<Layout | null> {
        // Delivered pages come with their layout already resolved.
        if (page && Object.prototype.hasOwnProperty.call(page, "layout")) {
            return page.layout ?? null;
        }

        const layoutId = page?.properties?.layout;
        if (typeof layoutId !== "string" || !layoutId) {
            return null;
        }

        // A layout that can't be read is delivered as none, so the frontend falls back to its own layout.
        try {
            const result = await this.getPageLayout.execute({
                layoutId,
                language: page?.properties?.language
            });
            return result.isOk() ? result.value : null;
        } catch {
            return null;
        }
    }
}

export const PageLayoutDtoMapper = MapperAbstraction.createImplementation({
    implementation: PageLayoutDtoMapperImpl,
    dependencies: [GetPageLayoutUseCase]
});
