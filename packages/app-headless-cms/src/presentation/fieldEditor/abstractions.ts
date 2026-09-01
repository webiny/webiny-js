import { createAbstraction } from "@webiny/feature/admin";
import { FormModel, FormModelFactory } from "@webiny/app-admin";
import type { CmsModel, CmsModelField } from "~/types.js";
import type { ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";

export interface ICmsFieldEditorFormBuilder {
    fields(
        fn: (
            fields: FormModelFactory.FieldBuilderRegistry
        ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]): void;
}

export interface ICmsFieldEditorContext {
    field: CmsModelField;
    model: CmsModel;
    fieldType: ICmsFieldType;
}

export interface ICmsFieldEditorGroup {
    readonly name: string;
    readonly label: string;
    buildForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext): void;
    mapToForm(field: CmsModelField, context: ICmsFieldEditorContext): Record<string, any>;
    mapFromForm(
        formData: Record<string, any>,
        field: CmsModelField,
        context: ICmsFieldEditorContext
    ): void;
}

export const CmsFieldEditorGroup = createAbstraction<ICmsFieldEditorGroup>("CmsFieldEditorGroup");

export namespace CmsFieldEditorGroup {
    export type Interface = ICmsFieldEditorGroup;
    export type FormBuilder = ICmsFieldEditorFormBuilder;
    export type Context = ICmsFieldEditorContext;
}

export interface ICmsFieldEditorGroupModifier {
    readonly group: string;
    shouldApply?(context: ICmsFieldEditorContext): boolean;
    modifyForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext): void;
    mapToForm?(field: CmsModelField, context: ICmsFieldEditorContext): Record<string, any>;
    mapFromForm?(
        formData: Record<string, any>,
        field: CmsModelField,
        context: ICmsFieldEditorContext
    ): void;
}

export const CmsFieldEditorGroupModifier = createAbstraction<ICmsFieldEditorGroupModifier>(
    "CmsFieldEditorGroupModifier"
);

export namespace CmsFieldEditorGroupModifier {
    export type Interface = ICmsFieldEditorGroupModifier;
    export type FormBuilder = ICmsFieldEditorFormBuilder;
    export type Context = ICmsFieldEditorContext;
}

export interface IFieldEditorPresenter {
    readonly vm: { form: FormModel.FormVM | null };
    init(field: CmsModelField, model: CmsModel): void;
    submit(): Promise<CmsModelField | false>;
}

export const FieldEditorPresenter =
    createAbstraction<IFieldEditorPresenter>("FieldEditorPresenter");

export namespace FieldEditorPresenter {
    export type Interface = IFieldEditorPresenter;
}
