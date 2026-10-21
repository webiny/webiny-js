import { Result } from "@webiny/feature/api";
import {
    CountLayoutPagesRepository,
    GetLayoutUsageUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { GetLayoutSettingsRepository } from "~/features/layouts/GetLayoutSettings/index.js";
import type { Layout } from "~/domain/layout/abstractions.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";

class GetLayoutUsageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private countLayoutPages: CountLayoutPagesRepository.Interface,
        private getLayoutSettings: GetLayoutSettingsRepository.Interface
    ) {}

    async execute(layout: Layout): UseCaseAbstraction.Return {
        const lineage = LayoutLineage.from(layout);

        // A language version is used by the pages in its language that reference its source.
        if (lineage.isLanguageVersion()) {
            const language = layout.properties.language;
            if (!language) {
                return Result.ok({ pages: 0, isDefault: false });
            }

            const pages = await this.countLayoutPages.execute({
                layoutId: lineage.sourceEntryId(),
                language
            });
            if (pages.isFail()) {
                return Result.fail(pages.error);
            }

            return Result.ok({ pages: pages.value, isDefault: false });
        }

        const [pages, settings] = await Promise.all([
            this.countLayoutPages.execute({ layoutId: layout.entryId }),
            this.getLayoutSettings.execute()
        ]);
        if (pages.isFail()) {
            return Result.fail(pages.error);
        }
        if (settings.isFail()) {
            return Result.fail(settings.error);
        }

        return Result.ok({
            pages: pages.value,
            isDefault: settings.value.defaultLayout === layout.entryId
        });
    }
}

export const GetLayoutUsageUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutUsageUseCaseImpl,
    dependencies: [CountLayoutPagesRepository, GetLayoutSettingsRepository]
});
