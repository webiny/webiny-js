import type {
    IFieldBuilder,
    IFieldBuilderRegistry,
    IFormModelConfig
} from "@webiny/app-admin/features/formModel/abstractions.js";
import {
    isLayoutField,
    type CmsEditorFieldsLayout,
    type CmsModel,
    type CmsModelField
} from "~/types.js";
import type {
    ICmsFieldTypeMapper,
    ICmsFieldMapperContext,
    ICmsFormModelBuilder
} from "./abstractions.js";
import { CmsFormModelBuilder as BuilderAbstraction } from "./abstractions.js";
import { CmsFieldTypeMapper } from "./abstractions.js";
import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { ICmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import { mapCmsLayout } from "./CmsLayoutMapper.js";
import { createBuiltInMappers } from "./mappers/index.js";
import { applyFieldProps } from "./mappers/applyFieldProps.js";

class CmsFormModelBuilderImpl implements ICmsFormModelBuilder {
    private mappers: Map<string, ICmsFieldTypeMapper>;
    private rendererMap: Map<string, string>;

    constructor(
        customMappers: ICmsFieldTypeMapper[] | undefined,
        fieldRenderers: ICmsFieldRenderer[] | undefined
    ) {
        this.mappers = new Map();
        for (const mapper of createBuiltInMappers()) {
            this.mappers.set(mapper.type, mapper);
        }
        for (const mapper of customMappers || []) {
            this.mappers.set(mapper.type, mapper);
        }

        this.rendererMap = new Map();
        for (const renderer of fieldRenderers || []) {
            this.rendererMap.set(renderer.rendererName, renderer.formRenderer);
        }
    }

    build(model: CmsModel): IFormModelConfig {
        const context: ICmsFieldMapperContext = {
            model,
            rendererMap: this.rendererMap,
            mapField: (field, registry) => this.mapField(field, registry, context)
        };

        const idToFieldId = new Map<string, string>();
        for (const field of model.fields) {
            idToFieldId.set(field.id, field.fieldId);
        }

        const fieldIdsInLayout = model.layout ? collectFieldIds(model.layout, idToFieldId) : null;

        return {
            fields: registry => {
                const result: Record<string, IFieldBuilder> = {};
                for (const field of model.fields) {
                    const builder = this.mapField(field, registry, context);
                    if (fieldIdsInLayout && !fieldIdsInLayout.has(field.fieldId)) {
                        builder.hidden();
                    }
                    result[field.fieldId] = builder;
                }
                return result;
            },
            layout: model.layout
                ? layout => mapCmsLayout(model.layout!, layout, idToFieldId)
                : undefined
        };
    }

    private mapField(
        field: CmsModelField,
        registry: IFieldBuilderRegistry,
        context: ICmsFieldMapperContext
    ): IFieldBuilder {
        const mapper = this.mappers.get(field.type);
        if (mapper) {
            return mapper.map(field, registry, context);
        }

        return applyFieldProps(registry.text(), field, context.rendererMap);
    }
}

export const CmsFormModelBuilder = BuilderAbstraction.createImplementation({
    implementation: CmsFormModelBuilderImpl,
    dependencies: [
        [CmsFieldTypeMapper, { multiple: true, optional: true }],
        [CmsFieldRenderer, { multiple: true, optional: true }]
    ]
});

function collectFieldIds(
    layout: CmsEditorFieldsLayout,
    idToFieldId: Map<string, string>
): Set<string> {
    const fieldIds = new Set<string>();

    for (const row of layout) {
        for (const cell of row) {
            if (typeof cell === "string") {
                const fieldId = idToFieldId.get(cell);
                if (fieldId) {
                    fieldIds.add(fieldId);
                }
            } else if (isLayoutField(cell) && cell.type === "tabs") {
                const tabsField = cell as { tabs: Array<{ layout: CmsEditorFieldsLayout }> };
                for (const tab of tabsField.tabs) {
                    for (const id of collectFieldIds(tab.layout, idToFieldId)) {
                        fieldIds.add(id);
                    }
                }
            }
        }
    }

    return fieldIds;
}
