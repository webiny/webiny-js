import { createAbstraction } from "@webiny/feature/admin";
import type { FormModel } from "@webiny/app-admin";

export interface AiPromptFormConfig {
    promptDescription?: string;
    promptDefaultValue?: string;
}

export interface IAiPromptFormFactory {
    createForm(config?: AiPromptFormConfig): FormModel.Interface;
    computeExcludedFileIds(form: FormModel.Interface): string[] | null;
}

export const AiPromptFormFactory = createAbstraction<IAiPromptFormFactory>("AiPromptFormFactory");

export namespace AiPromptFormFactory {
    export type Interface = IAiPromptFormFactory;
    export type Config = AiPromptFormConfig;
}
