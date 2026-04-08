import { createAbstraction } from "@webiny/feature/api";
import { CmsModelFieldPatternValidator } from "./CmsModelFieldPatternValidator.js";

export interface ICmsModelFieldPatternValidatorRegistry {
    get(name: string): CmsModelFieldPatternValidator.Interface | undefined;
    getAll(): CmsModelFieldPatternValidator.Interface[];
}

export const CmsModelFieldPatternValidatorRegistry =
    createAbstraction<ICmsModelFieldPatternValidatorRegistry>(
        "Cms/Model/Field/PatternValidator/Registry"
    );

export namespace CmsModelFieldPatternValidatorRegistry {
    export type Interface = ICmsModelFieldPatternValidatorRegistry;
}
