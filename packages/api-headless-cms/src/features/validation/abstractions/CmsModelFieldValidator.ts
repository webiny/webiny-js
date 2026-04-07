import { createAbstraction } from "@webiny/feature/createAbstraction.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/index.js";

export interface ICmsModelFieldValidator {
    readonly name: string;
    validate(params: CmsModelFieldValidatorValidateParams): Promise<boolean>;
}

export const CmsModelFieldValidator = createAbstraction<ICmsModelFieldValidator>(
    "Cms/Model/Field/Validator"
);

export namespace CmsModelFieldValidator {
    export type Interface = ICmsModelFieldValidator;
    export type Params = CmsModelFieldValidatorValidateParams;
    export type Response = Promise<boolean>;
}
