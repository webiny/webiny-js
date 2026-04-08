import { Result, createImplementation } from "@webiny/feature/api";
import { TranslatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DuplicatePageRepository } from "~/features/pages/DuplicatePage/abstractions.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { GetLanguageByCodeUseCase } from "@webiny/languages/exports/api/languages.js";
import { ListLanguagesUseCase } from "@webiny/languages/exports/api/languages.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import {
    PageNotAuthorizedError,
    PageTranslationError,
    PagePersistenceError
} from "~/domain/page/errors.js";
import { PagePath } from "~/domain/page/PagePath.js";

class TranslatePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private getLanguageByCode: GetLanguageByCodeUseCase.Interface,
        private listLanguages: ListLanguagesUseCase.Interface,
        private duplicatePageRepository: DuplicatePageRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        // Validate language code.
        const languageResult = await this.getLanguageByCode.execute(params.languageCode);
        if (languageResult.isFail()) {
            return Result.fail(new PageTranslationError(params.languageCode));
        }

        // Get all supported language codes.
        const languagesResult = await this.listLanguages.execute();
        if (languagesResult.isFail()) {
            return Result.fail(
                new PagePersistenceError(new Error("Failed to fetch supported languages"))
            );
        }

        const supportedCodes = languagesResult.value.map(lang => lang.code);

        // Fetch source page to resolve lineage.
        const getResult = await this.getPageById.execute(params.pageId);
        if (getResult.isFail()) {
            return getResult;
        }

        const sourcePage = getResult.value;

        // Resolve sourcePage: always point to the root base page.
        const resolvedSourcePageId = sourcePage.properties.sourcePage ?? sourcePage.entryId;

        // Duplicate the page with translation modifications.
        const result = await this.duplicatePageRepository.execute(
            { id: params.pageId },
            ({ duplicate }) => {
                const originalPath: string = sourcePage.properties.path ?? "/";
                const pagePath = PagePath.create(originalPath);
                const translatedPath = pagePath
                    .setLanguageCode(params.languageCode, supportedCodes)
                    .toString();

                duplicate.properties.language = params.languageCode;
                duplicate.properties.sourcePage = resolvedSourcePageId;
                duplicate.properties.path = translatedPath;
                duplicate.properties.title = sourcePage.properties.title;
                duplicate.location.folderId = params.folderId;
            }
        );

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }
}

export const TranslatePageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: TranslatePageUseCaseImpl,
    dependencies: [
        WbPermissions,
        GetPageByIdUseCase,
        GetLanguageByCodeUseCase,
        ListLanguagesUseCase,
        DuplicatePageRepository
    ]
});
