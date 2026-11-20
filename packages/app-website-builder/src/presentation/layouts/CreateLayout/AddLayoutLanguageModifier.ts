import { reaction } from "mobx";
import type { FormModel } from "@webiny/app-admin";
import {
    ListLanguagesRepository,
    ListLanguagesUseCase
} from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import type { CreateLayoutData } from "~/features/layouts/index.js";
import { CreateLayoutFormModifier } from "./abstractions.js";

/**
 * Adds the layout's language to the create layout form:
 * - no languages: no field, and no language is stored,
 * - one language: it's assigned, without a field,
 * - two or more: a select of the languages, with the default one preselected. It can be cleared, for a
 *   layout without a language.
 */
class AddLayoutLanguageModifierImpl implements CreateLayoutFormModifier.Interface {
    constructor(
        private useCase: ListLanguagesUseCase.Interface,
        private repository: ListLanguagesRepository.Interface
    ) {}

    modifyForm(form: FormModel.Interface): void {
        void this.useCase.execute();

        form.fields(fields => ({
            language: fields
                .text()
                .label("Language")
                .description("Pages in this language can use the layout.")
                .hidden()
                .options(() => this.getLanguageOptions())
        }));

        // The field starts hidden, and is shown once the languages load, if there are two or more.
        form.layout(layout => [layout.row("language").before("title")]);

        const dispose = reaction(
            () => this.repository.getLanguages(),
            languages => {
                if (languages.length === 0) {
                    return;
                }

                const languageField = form.field("language");
                const defaultCode = this.getDefaultLanguageCode();

                if (!languageField.getValue() && defaultCode) {
                    languageField.setValue(defaultCode);
                }

                if (languages.length > 1) {
                    languageField.setVisible(true);
                }

                dispose();
            },
            { fireImmediately: true }
        );
    }

    mapFromForm(data: Record<string, unknown>, input: CreateLayoutData): void {
        const language = typeof data.language === "string" ? data.language : "";
        // Only a language the site has is stored.
        if (language && this.repository.getLanguages().some(item => item.code === language)) {
            input.language = language;
        }
    }

    private getDefaultLanguageCode(): string | undefined {
        const languages = this.repository.getLanguages();
        const defaultLanguage = languages.find(language => language.isDefault);
        return defaultLanguage?.code ?? languages[0]?.code;
    }

    private getLanguageOptions() {
        return this.repository.getLanguages().map(language => ({
            label: `${language.name} (${language.code})`,
            value: language.code
        }));
    }
}

export const AddLayoutLanguageModifier = CreateLayoutFormModifier.createImplementation({
    implementation: AddLayoutLanguageModifierImpl,
    dependencies: [ListLanguagesUseCase, ListLanguagesRepository]
});
