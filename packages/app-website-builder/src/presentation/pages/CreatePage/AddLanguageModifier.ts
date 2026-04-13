import { reaction } from "mobx";
import { FormModel } from "@webiny/app-admin";
import {
    ListLanguagesUseCase,
    ListLanguagesRepository
} from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import { CreatePageFormModifier } from "~/presentation/pages/CreatePage/abstractions.js";
import type { CreatePageParams } from "~/features/pages/createPage/abstractions.js";
import { PagePath } from "~/shared/PagePath.js";

/**
 * Modifier that adds a language select field to the CreatePage form.
 * When a language is selected, the path is prefixed with the language code.
 */
class AddLanguagePageFormModifier implements CreatePageFormModifier.Interface {
    constructor(
        private useCase: ListLanguagesUseCase.Interface,
        private repository: ListLanguagesRepository.Interface
    ) {}

    modifyForm(form: FormModel.Interface): void {
        void this.useCase.execute();

        form.fields(fields => ({
            language: fields
                .select()
                .label("Language")
                .hidden()
                .options(() => this.getLanguageOptions())
                .afterChange((value, form) => this.afterChange(value, form))
        }));

        // When title blur generates a path, add the language prefix.
        form.field("title").addOnBlur((_value, f) => {
            const path = String(f.field("path").getValue() || "");
            if (!path) {
                return;
            }
            const langCode = String(f.field("language").getValue() || "");
            if (!langCode || !this.shouldPrefixPath()) {
                return;
            }
            f.field("path").setValue(
                PagePath.create(path).setLanguageCode(langCode, this.getSupportedCodes()).toString()
            );
        });

        // Field starts hidden. Show it once languages load (if 2+).
        // - 0 languages: field stays hidden, no value.
        // - 1 language: auto-assign, stay hidden (no dropdown, no prefix).
        // - 2+ languages: make visible (show dropdown), preselect default, prefix paths.
        form.layout(layout => [layout.row("language").before("title")]);

        const dispose = reaction(
            () => this.repository.getLanguages(),
            languages => {
                if (languages.length === 0) {
                    return;
                }

                const languageField = form.field("language");

                const defaultCode = this.getDefaultLanguageCode();
                const current = languageField.getValue();

                if (!current && defaultCode) {
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

    mapFromForm(data: Record<string, unknown>, input: CreatePageParams): void {
        if (data.language) {
            input.properties ??= {};
            input.properties.language = data.language;
        }
    }

    private getSupportedCodes(): string[] {
        return this.repository.getLanguages().map(l => l.code);
    }

    private getDefaultLanguageCode(): string | undefined {
        const languages = this.repository.getLanguages();
        const defaultLang = languages.find(l => l.isDefault);
        return defaultLang?.code ?? languages[0]?.code;
    }

    private shouldPrefixPath(): boolean {
        return this.repository.getLanguages().length > 1;
    }

    private afterChange(value: unknown, f: FormModel.Interface) {
        const langCode = String(value);
        const codes = this.getSupportedCodes();

        const path = f.field("path").getValue<string>() || "";
        const stripped = PagePath.create(path).stripLanguageCode(codes);
        const needsPrefix = langCode && this.shouldPrefixPath();

        // Determine the bare path — either from existing path or from title.
        let barePath = stripped;
        if (barePath.isEmpty()) {
            const title = f.field("title").getValue<string>() || "";
            if (title) {
                barePath = PagePath.fromTitle(title);
            }
        }

        if (barePath.isEmpty()) {
            // No path and no title — nothing to do.
            f.setData({ ...f.getData(), path: null });
        } else if (needsPrefix) {
            f.field("path").setValue(barePath.setLanguageCode(langCode, codes).toString());
        } else {
            f.field("path").setValue(barePath.toString());
        }
    }

    private getLanguageOptions() {
        return this.repository.getLanguages().map(lang => ({
            label: lang.name,
            value: lang.code
        }));
    }
}

export const AddLanguageModifier = CreatePageFormModifier.createImplementation({
    implementation: AddLanguagePageFormModifier,
    dependencies: [ListLanguagesUseCase, ListLanguagesRepository]
});
