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
import type { ICmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import { collectFieldIds, mapCmsLayout } from "./CmsLayoutMapper.js";
import { createBuiltInMappers } from "./mappers/index.js";
import { applyFieldProps } from "./mappers/applyFieldProps.js";

/** What one `build()` reads: the mappers and renderers registered at that moment. */
interface BuildCatalogue {
    mappers: Map<string, ICmsFieldTypeMapper>;
    renderers: Map<string, ICmsFieldRenderer>;
}

function createCatalogue(
    customMappers: ICmsFieldTypeMapper[],
    fieldRenderers: ICmsFieldRenderer[]
): BuildCatalogue {
    const mappers = new Map<string, ICmsFieldTypeMapper>();
    for (const mapper of createBuiltInMappers()) {
        mappers.set(mapper.type, mapper);
    }
    for (const mapper of customMappers) {
        mappers.set(mapper.type, mapper);
    }

    const renderers = new Map<string, ICmsFieldRenderer>();
    for (const renderer of fieldRenderers) {
        renderers.set(renderer.rendererName, renderer);
    }

    return { mappers, renderers };
}

function toRendererMap(renderers: Map<string, ICmsFieldRenderer>): Map<string, string> {
    const rendererMap = new Map<string, string>();
    for (const [name, renderer] of renderers) {
        rendererMap.set(name, renderer.formRenderer);
    }
    return rendererMap;
}

/**
 * A list renderer can't render a single value: `dateTimeInputs` calls `.map()` on a
 * stored date string and crashes the form. When a single-value field is configured with
 * a renderer that only accepts list fields, drop it so the field type's default
 * single-value renderer is used instead.
 */
function withCompatibleRenderer(
    field: CmsModelField,
    model: CmsModel,
    renderers: Map<string, ICmsFieldRenderer>
): CmsModelField {
    if (field.list || !field.renderer || typeof field.renderer !== "object") {
        return field;
    }
    const renderer = renderers.get(field.renderer.name);
    if (!renderer || renderer.canUse({ field, model })) {
        return field;
    }
    if (!renderer.canUse({ field: { ...field, list: true }, model })) {
        return field;
    }
    if (process.env.NODE_ENV === "development") {
        console.warn(
            `[CmsFormModelBuilder] Renderer "${field.renderer.name}" is for list fields; ` +
                `field "${field.fieldId}" is not a list and uses its default renderer instead.`
        );
    }
    // Mappers treat a missing renderer as "use the field type's default".
    const { renderer: _renderer, ...rest } = field;
    return rest as CmsModelField;
}

function mapField(
    modelField: CmsModelField,
    registry: IFieldBuilderRegistry,
    context: ICmsFieldMapperContext,
    catalogue: BuildCatalogue
): IFieldBuilder {
    const field = withCompatibleRenderer(modelField, context.model, catalogue.renderers);
    const mapper = catalogue.mappers.get(field.type);
    if (mapper) {
        return mapper.map(field, registry, context);
    }

    return applyFieldProps(registry.text(), field, context.rendererMap);
}

/**
 * Turns a CMS model into a form model config.
 *
 * Mappers and renderers are read on every `build()`, not once. The builder is a singleton and so
 * are the presenters holding it, while renderers can be registered at any time, for example by an
 * extension the admin loads at runtime. Reading them once would leave every renderer registered
 * after the first entry form out of every later form.
 */
export class CmsFormModelBuilderImpl implements ICmsFormModelBuilder {
    constructor(
        private readonly getMappers: () => ICmsFieldTypeMapper[],
        private readonly getRenderers: () => ICmsFieldRenderer[]
    ) {}

    build(model: CmsModel): IFormModelConfig {
        const mappers = this.getMappers();
        const renderers = this.getRenderers();
        const catalogue = createCatalogue(mappers, renderers);

        const context: ICmsFieldMapperContext = {
            model,
            rendererMap: toRendererMap(catalogue.renderers),
            mapField: (field, registry) => mapField(field, registry, context, catalogue)
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
                    const builder = mapField(field, registry, context, catalogue);
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
}
