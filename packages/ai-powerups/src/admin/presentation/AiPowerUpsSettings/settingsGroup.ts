import { createAbstraction } from "@webiny/feature/admin";
import { FormModelFactory, Icon } from "@webiny/app-admin";
import type { LayoutNode } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IAiPowerUpsSettingsGroupFormBuilder {
    fields(
        fn: (
            fields: FormModelFactory.FieldBuilderRegistry
        ) => Record<string, FormModelFactory.FieldBuilder>
    ): void;
    layout(fn: (layout: FormModelFactory.LayoutBuilder) => LayoutNode[]): void;
}

export interface IAiPowerUpsSettingsGroup {
    name: string;
    label: string;
    description?: string;
    icon?: Icon;
    buildForm(formBuilder: IAiPowerUpsSettingsGroupFormBuilder): void;
}

export const AiPowerUpsSettingsGroup = createAbstraction<IAiPowerUpsSettingsGroup>(
    "AiPowerUps/SettingsGroup"
);

export namespace AiPowerUpsSettingsGroup {
    export type Interface = IAiPowerUpsSettingsGroup;
    export type FormBuilder = IAiPowerUpsSettingsGroupFormBuilder;
}
