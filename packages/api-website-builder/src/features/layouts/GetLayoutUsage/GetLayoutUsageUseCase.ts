import { Result } from "@webiny/feature/api";
import {
    CountLayoutPagesRepository,
    GetLayoutUsageUseCase as UseCaseAbstraction,
    ListLayoutModelsRepository
} from "./abstractions.js";
import { GetLayoutSettingsRepository } from "~/features/layouts/GetLayoutSettings/index.js";
import type { Layout } from "~/domain/layout/abstractions.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";

class GetLayoutUsageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private countLayoutPages: CountLayoutPagesRepository.Interface,
        private getLayoutSettings: GetLayoutSettingsRepository.Interface,
        private listLayoutModels: ListLayoutModelsRepository.Interface
    ) {}

    async execute(layout: Layout): UseCaseAbstraction.Return {
        const lineage = LayoutLineage.from(layout);

        // A language version is used by the pages in its language that reference its source.
        if (lineage.isLanguageVersion()) {
            const language = layout.properties.language;
            if (!language) {
                return Result.ok({ pages: 0, isDefault: false, models: [] });
            }

            const pages = await this.countLayoutPages.execute({
                layoutId: lineage.sourceEntryId(),
                language
            });
            if (pages.isFail()) {
                return Result.fail(pages.error);
            }

            return Result.ok({ pages: pages.value, isDefault: false, models: [] });
        }

        const [pages, settings, models] = await Promise.all([
            this.countLayoutPages.execute({ layoutId: layout.entryId }),
            this.getLayoutSettings.execute(),
            this.getModels(layout.properties.slug)
        ]);
        if (pages.isFail()) {
            return Result.fail(pages.error);
        }
        if (settings.isFail()) {
            return Result.fail(settings.error);
        }
        if (models.isFail()) {
            return Result.fail(models.error);
        }

        return Result.ok({
            pages: pages.value,
            isDefault: settings.value.defaultLayout === layout.entryId,
            models: models.value
        });
    }

    // An older layout without a slug can't be named by a model.
    private async getModels(slug: string | null | undefined): ListLayoutModelsRepository.Return {
        if (typeof slug !== "string" || !slug) {
            return Result.ok([]);
        }
        return this.listLayoutModels.execute(slug);
    }
}

export const GetLayoutUsageUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutUsageUseCaseImpl,
    dependencies: [
        CountLayoutPagesRepository,
        GetLayoutSettingsRepository,
        ListLayoutModelsRepository
    ]
});
