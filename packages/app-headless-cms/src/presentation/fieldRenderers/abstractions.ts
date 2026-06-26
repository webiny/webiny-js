import { createAbstraction } from "@webiny/feature/admin";
import { FormModel, FormModelFactory } from "@webiny/app-admin";
import type { CmsModel, CmsModelField } from "~/types.js";

export interface ICmsFieldRendererFormBuilder {
    fields(
        fn: (
            fields: FormModelFactory.FieldBuilderRegistry
        ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]): void;
}

export interface ICmsFieldRenderer {
    readonly rendererName: string;
    readonly formRenderer: string;
    readonly name: string;
    readonly description: string;
    canUse(context: { field: CmsModelField; model: CmsModel }): boolean;
    buildSettingsForm?(form: ICmsFieldRendererFormBuilder): void;
}

export const CmsFieldRenderer = createAbstraction<ICmsFieldRenderer>("CmsFieldRenderer");

export namespace CmsFieldRenderer {
    export type Interface = ICmsFieldRenderer;
    export type FormBuilder = ICmsFieldRendererFormBuilder;
}
