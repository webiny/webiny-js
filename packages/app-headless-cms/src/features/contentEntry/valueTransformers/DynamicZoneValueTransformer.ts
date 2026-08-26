import { CmsEntryValueTransformer, type ICmsEntryValueTransformer } from "./abstractions.js";
import { EntryDataPreparer, type IEntryDataPreparer } from "./EntryDataPreparer.js";
import type { CmsModelField, CmsDynamicZoneTemplate } from "~/types.js";

interface TemplateValue {
    _templateId: string;
    _id?: string;
    [key: string]: unknown;
}

class DynamicZoneValueTransformerImpl implements ICmsEntryValueTransformer {
    readonly fieldType = "dynamicZone";

    constructor(private preparer: IEntryDataPreparer) {}

    transform(value: unknown, field: CmsModelField): unknown {
        const templates: CmsDynamicZoneTemplate[] = field.settings?.templates || [];

        if (field.list && Array.isArray(value)) {
            return value
                .map(item => this.convertItem(item as TemplateValue, templates))
                .filter(Boolean);
        }

        if (value && typeof value === "object" && "_templateId" in value) {
            return this.convertItem(value as TemplateValue, templates);
        }

        return value;
    }

    private convertItem(
        item: TemplateValue,
        templates: CmsDynamicZoneTemplate[]
    ): Record<string, unknown> | undefined {
        const { _templateId, _id, ...values } = item;
        const template = templates.find(tpl => tpl.id === _templateId);
        if (!template) {
            return undefined;
        }

        return {
            [template.gqlTypeName]: {
                ...this.preparer.prepare(values, template.fields || []),
                ...(_id !== undefined ? { _id } : {})
            }
        };
    }
}

export const DynamicZoneValueTransformer = CmsEntryValueTransformer.createImplementation({
    implementation: DynamicZoneValueTransformerImpl,
    dependencies: [EntryDataPreparer]
});
