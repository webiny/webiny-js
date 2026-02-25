import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import {
    FieldBuilder,
    type FieldBuildResult,
    type LayoutFieldBuildResult
} from "./FieldBuilder.js";
import { type IFieldBuilderRegistry } from "../abstractions.js";
import type { CmsIcon, CmsModelField, CmsModelLayout, CmsModelLayoutCell } from "~/types/index.js";
import { UiFieldBuilder } from "./UiFieldType.js";

interface ITab {
    id: string;
    name: string;
    icon: CmsIcon | undefined;
    description: string;
    fields: CmsModelField[];
    layout: CmsModelLayout;
}

interface ITabConfig {
    name: string;
    icon?: CmsIcon;
    description?: string;
    fields: (registry: IFieldBuilderRegistry) => Record<string, FieldBuilder<any>>;
    layout?: string[][];
}

export interface IUiTabsFieldBuilder extends UiFieldBuilder {
    tab(id: string, config: ITabConfig): this;
    list(): this;
}

class TabsFieldBuilder extends UiFieldBuilder implements IUiTabsFieldBuilder {
    private readonly tabs: ITab[] = [];

    public constructor(private registry: IFieldBuilderRegistry) {
        super();
    }

    public tab(id: string, config: ITabConfig): this {
        const fieldBuilders = config.fields(this.registry);
        const fields: CmsModelField[] = [];
        const layoutReplacements = new Map<string, CmsModelLayoutCell>();

        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            fieldBuilder.fieldId(key);
            const result: FieldBuildResult = (fieldBuilder as any).build();
            if (result.type === "layout") {
                layoutReplacements.set(key, result.layoutCell);
                if (result.fields) {
                    fields.push(...result.fields);
                }
            } else {
                fields.push(result.field);
            }
        }

        const rawLayout: string[][] = config.layout || [];
        const layout: CmsModelLayout = rawLayout.map(row =>
            row.map(cell => layoutReplacements.get(cell) ?? cell)
        );

        this.tabs.push({
            id,
            name: config.name,
            icon: config.icon,
            description: config.description || "",
            fields,
            layout
        });

        return this;
    }

    public override list(): this {
        // No-op: tabs is a layout-only field and cannot be a list.
        return this;
    }

    public override build(): LayoutFieldBuildResult {
        const hoistedFields: CmsModelField[] = [];
        const layoutTabs = [];

        for (const tab of this.tabs) {
            hoistedFields.push(...tab.fields);
            layoutTabs.push({
                id: tab.id,
                label: tab.name,
                icon: tab.icon || null,
                layout: tab.layout
            });
        }

        return {
            type: "layout",
            layoutCell: {
                type: "tabs",
                label: this.config.label,
                description: this.config.description || null,
                help: this.config.help || null,
                tabs: layoutTabs
            },
            fields: hoistedFields
        };
    }
}

class TabsFieldTypeFactory implements IFieldTypeFactory {
    public readonly type = "ui:tabs";

    public create(registry: IFieldBuilderRegistry): IUiTabsFieldBuilder {
        return new TabsFieldBuilder(registry);
    }
}

export const UiTabsFieldType = FieldType.createImplementation({
    implementation: TabsFieldTypeFactory,
    dependencies: []
});

// Module augmentation for TypeScript autocomplete
declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        uiTabs(): IUiTabsFieldBuilder;
    }
}
