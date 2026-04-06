import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

export interface ICmsModelFieldValidator {
    readonly name: string;
    validate(params: CmsModelFieldValidatorValidateParams): Promise<boolean>;
}

export const CmsModelFieldValidator = createAbstraction<ICmsModelFieldValidator>(
    "Cms/Model/Field/Validator"
);

export namespace CmsModelFieldValidator {
    export type Interface = ICmsModelFieldValidator;
}

export interface ICmsModelFieldValidatorRegistry {
    get(name: string): CmsModelFieldValidator.Interface | undefined;
    getAll(): CmsModelFieldValidator.Interface[];
}

export const CmsModelFieldValidatorRegistry = createAbstraction<ICmsModelFieldValidatorRegistry>(
    "Cms/Model/Field/Validator/Registry"
);

export namespace CmsModelFieldValidatorRegistry {
    export type Interface = ICmsModelFieldValidatorRegistry;
}
