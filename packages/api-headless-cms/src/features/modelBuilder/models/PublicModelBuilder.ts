import upperFirst from "lodash/upperFirst.js";
import camelCase from "lodash/camelCase.js";
import pluralize from "pluralize";
import { createModelPlugin } from "~/plugins/CmsModelPlugin.js";
import type { CmsModelGroup } from "~/types/index.js";
import { BaseModelBuilder } from "./BaseModelBuilder.js";

const createApiName = (name: string) => {
    return upperFirst(camelCase(name));
};

const createPluralApiName = (name: string) => {
    return pluralize(createApiName(name));
};

export class PublicModelBuilder extends BaseModelBuilder {
    private publicConfig: {
        singularApiName?: string;
        pluralApiName?: string;
        group?: CmsModelGroup;
        icon?: string;
        description?: string;
        titleFieldId?: string;
        descriptionFieldId?: string;
        imageFieldId?: string;
        layout?: string[][];
    } = {};

    singularApiName(name: string): this {
        this.publicConfig.singularApiName = name;
        return this;
    }

    pluralApiName(name: string): this {
        this.publicConfig.pluralApiName = name;
        return this;
    }

    group(group: CmsModelGroup): this {
        this.publicConfig.group = group;
        return this;
    }

    icon(icon: string): this {
        this.publicConfig.icon = icon;
        return this;
    }

    description(description: string): this {
        this.publicConfig.description = description;
        return this;
    }

    titleFieldId(fieldId: string): this {
        this.publicConfig.titleFieldId = fieldId;
        return this;
    }

    descriptionFieldId(fieldId: string): this {
        this.publicConfig.descriptionFieldId = fieldId;
        return this;
    }

    imageFieldId(fieldId: string): this {
        this.publicConfig.imageFieldId = fieldId;
        return this;
    }

    layout(layout: string[][]): this {
        this.publicConfig.layout = layout;
        return this;
    }

    build() {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (!this.config.fields) {
            throw new Error("fields are required");
        }
        if (!this.publicConfig.group) {
            throw new Error("group is required");
        }

        return createModelPlugin({
            modelId: this.config.modelId,
            name: this.config.name,
            singularApiName: this.publicConfig.singularApiName || createApiName(this.config.name),
            pluralApiName: this.publicConfig.pluralApiName || createPluralApiName(this.config.name),
            group: this.publicConfig.group,
            icon: this.publicConfig.icon,
            description: this.publicConfig.description || null,
            titleFieldId: this.publicConfig.titleFieldId ?? "",
            descriptionFieldId: this.publicConfig.descriptionFieldId,
            imageFieldId: this.publicConfig.imageFieldId,
            layout: this.publicConfig.layout || [],
            fields: this.config.fields,
            tags: this.getTags()
        });
    }
}
