import { createAbstraction } from "@webiny/feature/admin";
import { FormModel, FormModelFactory } from "@webiny/app-admin";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import type { CmsModelFieldValidator } from "~/types.js";

export interface ICmsFieldValidatorVariable {
    name: string;
    description: string;
}

export interface ICmsFieldValidatorFormBuilder {
    message: FormModelFactory.FieldBuilder;
    fields(
        fn: (
            fields: FormModelFactory.FieldBuilderRegistry
        ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]): void;
}

export interface ICmsFieldValidatorContext {
    field: CmsModelField;
}

export interface ICmsFieldValidator {
    readonly name: string;
    readonly label: string;
    readonly description: string;
    readonly defaultMessage: string;
    readonly defaultSettings?: Record<string, unknown>;
    readonly variables?: ICmsFieldValidatorVariable[];

    getVariableValues?(context: { validator: CmsModelFieldValidator }): Record<string, string>;

    buildSettingsForm?(
        form: ICmsFieldValidatorFormBuilder,
        context: ICmsFieldValidatorContext
    ): void;

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        field: CmsModelField
    ): void;
}

export const CmsFieldValidator = createAbstraction<ICmsFieldValidator>("CmsFieldValidator");

export namespace CmsFieldValidator {
    export type Interface = ICmsFieldValidator;
    export type FormBuilder = ICmsFieldValidatorFormBuilder;
    export type Context = ICmsFieldValidatorContext;
    export type Variable = ICmsFieldValidatorVariable;
}
