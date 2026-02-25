import { FieldType, type IFieldTypeFactory } from "./abstractions.js";
import { FieldBuilder } from "./FieldBuilder.js";
import { type IFieldBuilderRegistry } from "../abstractions.js";
import type { CmsIcon } from "~/types/index.js";
import { UiFieldBuilder } from "./UiFieldType.js";

interface ITab {
    id: string;
    name: string;
    icon: CmsIcon | undefined;
    description: string;
    fields: any[];
    layout: string[][];
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
        const fields: any[] = [];

        for (const [key, fieldBuilder] of Object.entries(fieldBuilders)) {
            fieldBuilder.fieldId(key);
            fields.push((fieldBuilder as any).build());
        }

        this.tabs.push({
            id,
            name: config.name,
            icon: config.icon,
            description: config.description || "",
            fields,
            layout: config.layout || []
        });

        return this;
    }

    public override list(): this {
        // No-op: tabs is a layout-only field and cannot be a list.
        return this;
    }

    public override build() {
        this.config.settings = this.config.settings || {};
        this.config.settings.tabs = this.tabs;
        this.renderer("uiTabs");
        return super.build();
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
