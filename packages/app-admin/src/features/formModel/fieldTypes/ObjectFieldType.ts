import type { z } from "zod";
import {
    FieldType,
    type IFieldTypeFactory,
    type IFieldBuilder,
    type IFieldBuilderRegistry,
    type IObjectFieldBuilder,
    type IObjectFieldConfig,
    type ITemplateBuilder,
    type ITemplateConfig,
    type ITemplateIcon
} from "../abstractions.js";
import type { IFormModel } from "../abstractions.js";
import { FieldBuilder } from "../FieldBuilder.js";

interface TemplateBuilderInternal extends ITemplateBuilder {
    _build(id: string, registry: IFieldBuilderRegistry): ITemplateConfig;
}

export function createTemplateBuilder(): TemplateBuilderInternal {
    let label = "";
    let icon: ITemplateIcon | undefined;
    let fieldsFactory:
        | ((registry: IFieldBuilderRegistry) => Record<string, IFieldBuilder>)
        | undefined;
    let visibleFn: ((form: IFormModel) => boolean) | undefined;

    const builder: TemplateBuilderInternal = {
        label(text: string) {
            label = text;
            return builder;
        },
        icon(i: ITemplateIcon) {
            icon = i;
            return builder;
        },
        fields(factory) {
            fieldsFactory = factory;
            return builder;
        },
        visible(predicate) {
            visibleFn = predicate;
            return builder;
        },
        _build(id: string, registry: IFieldBuilderRegistry): ITemplateConfig {
            const childBuilders = fieldsFactory ? fieldsFactory(registry) : {};
            if ("_templateId" in childBuilders) {
                throw new Error(
                    `Template "${id}" defines a reserved field "_templateId". ` +
                        `The discriminator is added automatically.`
                );
            }
            return { id, label, icon, childBuilders, visible: visibleFn };
        }
    };
    return builder;
}

export class ObjectFieldBuilder extends FieldBuilder<"object"> implements IObjectFieldBuilder {
    private _childBuilders: Record<string, IFieldBuilder> = {};
    private _isList = false;
    private _listSchema?: z.ZodTypeAny;
    private _templates?: ITemplateConfig[];
    private _templateIds = new Set<string>();
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

    template(id: string, configure: (t: ITemplateBuilder) => void): this {
        if (id === "_templateId") {
            throw new Error(`Template id "_templateId" is reserved. Choose a different id.`);
        }
        if (this._templateIds.has(id)) {
            throw new Error(`Duplicate template id "${id}".`);
        }
        this._templateIds.add(id);

        const tb = createTemplateBuilder();
        configure(tb);

        if (!this._templates) {
            this._templates = [];
        }
        this._templates.push(tb._build(id, this._registry));

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
                `Object field "${name}" has both .fields() and .template() defined. ` +
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
