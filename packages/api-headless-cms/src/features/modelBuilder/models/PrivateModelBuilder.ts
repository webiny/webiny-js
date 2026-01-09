import type { CmsPrivateModelFull } from "~/plugins/CmsModelPlugin.js";
import type { CmsModelField } from "~/types/index.js";
import {
    FieldBuilder,
    FieldBuilderRegistry,
    type IPrivateModelBuilder
} from "~/features/modelBuilder/index.js";

export class PrivateModelBuilder implements IPrivateModelBuilder {
    private config: {
        modelId?: string;
        name?: string;
        titleFieldId?: string;
        fields?: CmsModelField[];
    } = {};

    constructor(private registry: FieldBuilderRegistry.Interface) {}

    modelId(id: string): this {
        this.config.modelId = id;
        return this;
    }

    name(name: string): this {
        this.config.name = name;
        return this;
    }

    titleFieldId(id: string): this {
        this.config.titleFieldId = id;
        return this;
    }

    fields(
        builder: (registry: FieldBuilderRegistry.Interface) => Record<string, FieldBuilder<any>>
    ): this {
        const fieldBuilders = builder(this.registry);
        const fields: CmsModelField[] = [];

        for (const [, fieldBuilder] of Object.entries(fieldBuilders)) {
            fields.push(fieldBuilder.build());
        }

        this.config.fields = fields;
        return this;
    }

    build(): Omit<CmsPrivateModelFull, "group" | "isPrivate"> {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (!this.config.fields) {
            throw new Error("fields are required");
        }

        return {
            modelId: this.config.modelId,
            name: this.config.name,
            titleFieldId: this.config.titleFieldId,
            fields: this.config.fields,
            authorization: false,
            noValidate: true
        };
    }
}
