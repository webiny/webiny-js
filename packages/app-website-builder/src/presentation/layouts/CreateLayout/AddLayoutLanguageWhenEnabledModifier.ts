import type { FormModel } from "@webiny/app-admin";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import {
    ListLanguagesRepository,
    ListLanguagesUseCase
} from "@webiny/languages/admin/features/listLanguages/abstractions.js";
import type { CreateLayoutData } from "~/features/layouts/index.js";
import { CreateLayoutFormModifier } from "./abstractions.js";
import { AddLayoutLanguageModifier } from "./AddLayoutLanguageModifier.js";

/**
 * Applies `AddLayoutLanguageModifier` only when the `languages` flag is on, checked when the form is
 * built. Registration happens earlier, against the flags cached in localStorage, which can predate the
 * ones the API sends. The languages use case and repository are optional because the Languages admin
 * extension only registers them when the flag is on. Mirrors the pages' `AddLanguageWhenEnabledModifier`.
 */
class AddLayoutLanguageWhenEnabledFormModifier implements CreateLayoutFormModifier.Interface {
    // Set when `modifyForm` added the language field, so `mapFromForm` maps it with the same modifier.
    private languageModifier: CreateLayoutFormModifier.Interface | null = null;

    constructor(
        private featureFlags: FeatureFlagsService.Interface,
        private useCase: ListLanguagesUseCase.Interface | undefined,
        private repository: ListLanguagesRepository.Interface | undefined
    ) {}

    modifyForm(form: FormModel.Interface): void {
        this.languageModifier = null;

        if (!this.featureFlags.getFlags().isEnabled("languages")) {
            return;
        }

        if (!this.useCase || !this.repository) {
            return;
        }

        this.languageModifier = new AddLayoutLanguageModifier(this.useCase, this.repository);
        this.languageModifier.modifyForm(form);
    }

    mapFromForm(data: Record<string, unknown>, input: CreateLayoutData): void {
        this.languageModifier?.mapFromForm?.(data, input);
    }
}

export const AddLayoutLanguageWhenEnabledModifier = CreateLayoutFormModifier.createImplementation({
    implementation: AddLayoutLanguageWhenEnabledFormModifier,
    dependencies: [
        FeatureFlagsService,
        [ListLanguagesUseCase, { optional: true }],
        [ListLanguagesRepository, { optional: true }]
    ]
});
