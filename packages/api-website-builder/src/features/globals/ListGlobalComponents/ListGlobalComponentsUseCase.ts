import { Result } from "@webiny/feature/api";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import {
    ListGlobalComponentsRepository,
    ListGlobalComponentsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";

class ListGlobalComponentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: ListGlobalComponentsRepository.Interface,
        private getDefaultLanguage?: GetDefaultLanguageUseCase.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Global components are part of every page, so reading them takes the same permission.
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const language = GlobalComponentLanguage.from(params.language);

        const own = await this.repository.execute({ language: language.toString() });
        if (own.isFail() || !params.fallback || language.isDefault()) {
            return own;
        }

        // A global missing in the language comes from the site's default language, else from "default".
        const fallbackLanguages: GlobalComponentLanguage[] = [];
        for (const candidate of [
            await this.getSiteDefaultLanguage(),
            GlobalComponentLanguage.default()
        ]) {
            if (
                candidate &&
                !candidate.equals(language) &&
                !fallbackLanguages.some(fallbackLanguage => fallbackLanguage.equals(candidate))
            ) {
                fallbackLanguages.push(candidate);
            }
        }

        const globalComponents = [...own.value];
        const names = new Set(globalComponents.map(globalComponent => globalComponent.name));

        for (const fallbackLanguage of fallbackLanguages) {
            const fallback = await this.repository.execute({
                language: fallbackLanguage.toString()
            });
            // Without the fallback, the globals found so far are still shown.
            if (fallback.isFail()) {
                continue;
            }

            for (const globalComponent of fallback.value) {
                if (!names.has(globalComponent.name)) {
                    names.add(globalComponent.name);
                    globalComponents.push(globalComponent);
                }
            }
        }

        return Result.ok(globalComponents);
    }

    private async getSiteDefaultLanguage() {
        if (!this.getDefaultLanguage) {
            return null;
        }

        const result = await this.getDefaultLanguage.execute();
        return result.isOk() ? GlobalComponentLanguage.from(result.value.code) : null;
    }
}

export const ListGlobalComponentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListGlobalComponentsUseCaseImpl,
    dependencies: [
        WbPermissions,
        ListGlobalComponentsRepository,
        [GetDefaultLanguageUseCase, { optional: true }]
    ]
});
