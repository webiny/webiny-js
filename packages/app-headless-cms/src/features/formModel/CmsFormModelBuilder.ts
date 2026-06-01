import type {
    IFieldBuilder,
    IFieldBuilderRegistry,
    IFormModelConfig
} from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel, CmsModelField } from "~/types.js";
import type {
    ICmsFieldTypeMapper,
    ICmsFieldMapperContext,
    ICmsFormModelBuilder
} from "./abstractions.js";
import { CmsFormModelBuilder as BuilderAbstraction } from "./abstractions.js";
import { CmsFieldTypeMapper } from "./abstractions.js";
import { mapCmsLayout } from "./CmsLayoutMapper.js";
import { createBuiltInMappers } from "./mappers/index.js";
import { applyFieldProps } from "./mappers/applyFieldProps.js";

class CmsFormModelBuilderImpl implements ICmsFormModelBuilder {
    private mappers: Map<string, ICmsFieldTypeMapper>;

    constructor(customMappers: ICmsFieldTypeMapper[] | undefined) {
        this.mappers = new Map();
        for (const mapper of createBuiltInMappers()) {
            this.mappers.set(mapper.type, mapper);
        }
        for (const mapper of customMappers || []) {
            this.mappers.set(mapper.type, mapper);
        }
    }

    build(model: CmsModel): IFormModelConfig {
        const context: ICmsFieldMapperContext = {
            model,
            mapField: (field, registry) => this.mapField(field, registry, context)
        };

        return {
            fields: registry => {
                const result: Record<string, IFieldBuilder> = {};
                for (const field of model.fields) {
                    result[field.fieldId] = this.mapField(field, registry, context);
                }
                return result;
            },
            layout: model.layout ? layout => mapCmsLayout(model.layout!, layout) : undefined
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

        return applyFieldProps(registry.text(), field);
    }
}

export const CmsFormModelBuilder = BuilderAbstraction.createImplementation({
    implementation: CmsFormModelBuilderImpl,
    dependencies: [[CmsFieldTypeMapper, { multiple: true, optional: true }]]
});
