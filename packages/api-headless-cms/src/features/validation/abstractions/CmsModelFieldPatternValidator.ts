import { createAbstraction } from "@webiny/feature/createAbstraction.js";

export interface PatternDefinition {
    readonly name: string;
    readonly regex: string;
    readonly flags: string;
}

export interface ICmsModelFieldPatternValidator {
    readonly pattern: PatternDefinition;
}

export const CmsModelFieldPatternValidator = createAbstraction<ICmsModelFieldPatternValidator>(
    "Cms/Model/Field/PatternValidator"
);

export namespace CmsModelFieldPatternValidator {
    export type Interface = ICmsModelFieldPatternValidator;
    export type Pattern = PatternDefinition;
}
