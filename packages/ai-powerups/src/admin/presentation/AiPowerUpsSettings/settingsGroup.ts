import { createAbstraction } from "@webiny/feature/admin";
import { FormModelFactory, FormModel, Icon } from "@webiny/app-admin";

export interface IAiPowerUpsSettingsGroupFormBuilder {
    fields(
        fn: (
            fields: FormModelFactory.FieldBuilderRegistry
        ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]): void;
}

export interface IAiPowerUpsSettingsGroup {
    name: string;
    label: string;
    description?: string;
    icon?: Icon;
    /**
     * Awaited before `buildForm` runs.
     *
     * Field *options* are evaluated lazily on render, so a group that only needs server data for a
     * select can fetch it in the background. Field *structure* is not: the Capabilities group
     * builds one field per capability registered on the api, so that list has to be in hand before
     * the form is built or the tab comes up empty.
     */
    init?(): Promise<void>;
    buildForm(formBuilder: IAiPowerUpsSettingsGroupFormBuilder): void;
}

export const AiPowerUpsSettingsGroup = createAbstraction<IAiPowerUpsSettingsGroup>(
    "AiPowerUps/SettingsGroup"
);

export namespace AiPowerUpsSettingsGroup {
    export type Interface = IAiPowerUpsSettingsGroup;
    export type FormBuilder = IAiPowerUpsSettingsGroupFormBuilder;
}
