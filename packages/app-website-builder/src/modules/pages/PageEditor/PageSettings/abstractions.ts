import { createAbstraction } from "@webiny/feature/admin";
import { FormModel } from "@webiny/app-admin";
import { FormModelFactory } from "@webiny/app-admin";
import type { Icon } from "@webiny/app-admin/components/IconPicker/types.js";
import type { EditorPage } from "@webiny/website-builder-sdk";

// Settings Group

export interface IPageSettingsGroupFormBuilder {
    fields(
        fn: (
            fields: FormModelFactory.FieldBuilderRegistry
        ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]): void;
}

export interface IPageDocument {
    properties: EditorPage["properties"];
    metadata: EditorPage["metadata"];
    extensions: EditorPage["extensions"];
}

export interface IPageSettingsGroup {
    name: string;
    label: string;
    description?: string;
    icon?: Icon;
    buildForm(formBuilder: IPageSettingsGroupFormBuilder): void;
    mapToForm(document: IPageDocument): Record<string, any>;
    mapFromForm(formData: Record<string, any>, document: IPageDocument): void;
}

export const PageSettingsGroup = createAbstraction<IPageSettingsGroup>("PageEditor/SettingsGroup");

export namespace PageSettingsGroup {
    export type Interface = IPageSettingsGroup;
    export type FormBuilder = IPageSettingsGroupFormBuilder;
    export type PageDocument = IPageDocument;
}

export interface IPageSettingsGroupModifier {
    group: string;
    modifyForm(formBuilder: IPageSettingsGroupFormBuilder): void;
    mapToForm?(document: PageSettingsGroupModifier.PageDocument): Record<string, any>;
    mapFromForm?(
        formData: Record<string, any>,
        document: PageSettingsGroupModifier.PageDocument
    ): void;
}

export const PageSettingsGroupModifier = createAbstraction<IPageSettingsGroupModifier>(
    "PageEditor/SettingsGroupModifier"
);

export namespace PageSettingsGroupModifier {
    export type Interface = IPageSettingsGroupModifier;
    export type PageDocument = IPageDocument;
    export type FormBuilder = IPageSettingsGroupFormBuilder;
}

// Presenter

export interface IPageSettingsVm {
    form: FormModel.FormVM | null;
    error: string | null;
}

export interface IPageSettingsPresenter {
    readonly vm: IPageSettingsVm;
    init(data: IPageDocument): void;
    submit(): Promise<IPageDocument | false>;
}

export const PageSettingsPresenter = createAbstraction<IPageSettingsPresenter>(
    "PageEditor/SettingsPresenter"
);

export namespace PageSettingsPresenter {
    export type Interface = IPageSettingsPresenter;
    export type ViewModel = IPageSettingsVm;
}
