import type { z } from "zod";
import {
    FieldType,
    type IFieldTypeFactory,
    type IFieldBuilder,
    type IFieldBuilderRegistry,
    type IObjectFieldBuilder,
    type IObjectFieldConfig,
    type ITemplate,
    type ITemplateConfig
} from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

export class ObjectFieldBuilder extends FieldBuilder<"object"> implements IObjectFieldBuilder {
    private _childBuilders: Record<string, IFieldBuilder> = {};
    private _isList = false;
    private _listSchema?: z.ZodTypeAny;
    private _templates?: ITemplateConfig[];
    private _registry: IFieldBuilderRegistry;

    constructor(registry: IFieldBuilderRegistry) {
        super("object");
        this._config.renderer = "objectAccordionSingle";
        this._registry = registry;
    }

    fields(fn: (registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>): this {
        this._childBuilders = fn(this._registry);
        return this;
    }

    override list(): this {
        this._isList = true;
        if (this._config.renderer === "objectAccordionSingle") {
            this._config.renderer = "objectAccordionMultiple";
        }
        return this;
    }

    listSchema(schema: z.ZodTypeAny): this {
        this._listSchema = schema;
        return this;
    }

    templates(templates: ITemplate[]): this {
        const seen = new Set<string>();
        this._templates = templates.map(t => {
            if (t.id === "_templateId") {
                throw new Error(`Template id "_templateId" is reserved. Choose a different id.`);
            }
            if (seen.has(t.id)) {
                throw new Error(`Duplicate template id "${t.id}".`);
            }
            seen.add(t.id);

            const childBuilders = t.fields(this._registry);
            if ("_templateId" in childBuilders) {
                throw new Error(
                    `Template "${t.id}" defines a reserved field "_templateId". ` +
                        `The discriminator is added automatically.`
                );
            }
            return {
                id: t.id,
                name: t.name,
                icon: t.icon,
                childBuilders,
                visible: t.visible
            };
        });

        if (
            this._config.renderer === "objectAccordionSingle" ||
            this._config.renderer === "objectAccordionMultiple"
        ) {
            this._config.renderer = "dynamicZone";
        }

        return this;
    }

    override build(name: string): IObjectFieldConfig {
        if (this._templates && Object.keys(this._childBuilders).length > 0) {
            throw new Error(
                `Object field "${name}" has both .fields() and .templates() defined. ` +
                    `Templates are mutually exclusive with .fields(); each template defines its own children.`
            );
        }

        return {
            ...this._config,
            name,
            childBuilders: this._childBuilders,
            isList: this._isList,
            listSchema: this._listSchema,
            templates: this._templates
        };
    }
}

class ObjectFieldTypeFactory implements IFieldTypeFactory {
    readonly type = "object";
    create(registry: IFieldBuilderRegistry) {
        return new ObjectFieldBuilder(registry);
    }
}

export const ObjectFieldType = FieldType.createImplementation({
    implementation: ObjectFieldTypeFactory,
    dependencies: []
});

declare module "../abstractions.js" {
    interface IFieldBuilderRegistry {
        object(): IObjectFieldBuilder;
    }
}
