import { createAbstraction } from "@webiny/feature/api";
import { CmsModelFieldValidator } from "./CmsModelFieldValidator.js";

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
