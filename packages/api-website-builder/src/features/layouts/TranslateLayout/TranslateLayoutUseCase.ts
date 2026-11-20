import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import { GetLanguageByCodeUseCase } from "@webiny/languages/exports/api/languages.js";
import { TranslateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { LayoutAfterTranslateEvent, LayoutBeforeTranslateEvent } from "./events.js";
import { GetLayoutRepository } from "~/features/layouts/GetLayout/index.js";
import { CreateLayoutRepository } from "~/features/layouts/CreateLayout/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError, LayoutTranslationError } from "~/domain/layout/errors.js";
import { LayoutEntryId } from "~/domain/layout/LayoutEntryId.js";
import { LayoutLineage } from "~/domain/layout/LayoutLineage.js";

class TranslateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getLayout: GetLayoutRepository.Interface,
        private createLayout: CreateLayoutRepository.Interface,
        private getLanguageByCode?: GetLanguageByCodeUseCase.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const { id, language } = params;

        if (typeof language !== "string" || !language) {
            return Result.fail(
                new LayoutTranslationError({
                    id,
                    language: String(language ?? ""),
                    message: "`language` must be a language code."
                })
            );
        }

        const getResult = await this.getLayout.execute(id);
        if (getResult.isFail()) {
            return getResult;
        }

        const original = getResult.value;

        const canAccess = await this.permissions.canAccess("page", original);
        if (!canAccess) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        if (LayoutLineage.from(original).isLanguageVersion()) {
            return Result.fail(
                new LayoutTranslationError({
                    id: original.entryId,
                    language,
                    message: "Only source layouts can be translated, not their language versions."
                })
            );
        }

        if (original.properties.language === language) {
            return Result.fail(
                new LayoutTranslationError({
                    id: original.entryId,
                    language,
                    message: `The layout is already in language "${language}".`
                })
            );
        }

        if (this.getLanguageByCode) {
            const languageResult = await this.getLanguageByCode.execute(language);
            if (languageResult.isFail()) {
                return Result.fail(
                    new LayoutTranslationError({
                        id: original.entryId,
                        language,
                        message: `Language "${language}" was not found.`
                    })
                );
            }
        }

        const versionId = LayoutEntryId.from(original.entryId).versionIn(language).toString();

        const existing = await this.getLayout.execute(versionId);
        if (existing.isOk()) {
            return Result.fail(
                new LayoutTranslationError({
                    id: original.entryId,
                    language,
                    message: `The layout already has a version in language "${language}".`
                })
            );
        }
        if (existing.error.code !== "WebsiteBuilder/Layout/NotFound") {
            return Result.fail(existing.error);
        }

        await this.eventPublisher.publish(new LayoutBeforeTranslateEvent({ original, language }));

        // A language version is named by its source's slug: it has none of its own.
        const { slug: _, ...properties } = original.properties;
        const copy = structuredClone({
            properties,
            metadata: original.metadata,
            elements: original.elements,
            bindings: original.bindings,
            extensions: original.extensions
        });

        const result = await this.createLayout.execute(
            {
                ...copy,
                properties: { ...copy.properties, language, sourceLayout: original.entryId }
            },
            { id: versionId }
        );
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new LayoutAfterTranslateEvent({ original, language, layout: result.value })
        );

        return result;
    }
}

export const TranslateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: TranslateLayoutUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetLayoutRepository,
        CreateLayoutRepository,
        [GetLanguageByCodeUseCase, { optional: true }]
    ]
});
