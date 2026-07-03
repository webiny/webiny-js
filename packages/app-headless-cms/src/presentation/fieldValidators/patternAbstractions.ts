import { createAbstraction } from "@webiny/feature/admin";
import type { CmsModel, CmsModelField } from "~/types.js";

export interface ICmsValidatorPattern {
    readonly name: string;
    readonly label: string;
    readonly message: string;
    readonly regex: string;
    readonly flags: string;
}

export interface ICmsValidatorPatternFactoryContext {
    field: CmsModelField;
    model?: CmsModel;
}

export interface ICmsValidatorPatternFactory {
    getPatterns(context: ICmsValidatorPatternFactoryContext): ICmsValidatorPattern[];
}

export const CmsValidatorPatternFactory = createAbstraction<ICmsValidatorPatternFactory>(
    "CmsValidatorPatternFactory"
);

export namespace CmsValidatorPatternFactory {
    export type Interface = ICmsValidatorPatternFactory;
    export type Context = ICmsValidatorPatternFactoryContext;
    export type Pattern = ICmsValidatorPattern;
}
