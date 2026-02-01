import upperFirst from "lodash/upperFirst.js";
import camelCase from "lodash/camelCase.js";
import pluralize from "pluralize";
import { createModelPlugin } from "~/plugins/CmsModelPlugin.js";
import { BaseModelBuilder } from "./BaseModelBuilder.js";
import type { CmsIcon } from "~/types/index.js";
import { LayoutBuilder } from "../LayoutBuilder.js";

const createApiName = (name: string) => {
    return upperFirst(camelCase(name));
};

const createPluralApiName = (name: string) => {
    return pluralize(createApiName(name));
};

class Icon {
    static from(icon: string | CmsIcon): CmsIcon {
        if (typeof icon === "string") {
            return {
                type: "icon",
                name: icon
            };
        }

        return icon;
    }
}

export class PublicModelBuilder extends BaseModelBuilder {
    private publicConfig: {
        singularApiName?: string;
        pluralApiName?: string;
        group?: string;
        icon?: CmsIcon;
        description?: string;
        titleFieldId?: string;
        descriptionFieldId?: string;
        imageFieldId?: string;
    } = {};
    private layoutBuilder: LayoutBuilder;

    singularApiName(name: string): this {
        this.publicConfig.singularApiName = name;
        return this;
    }

    pluralApiName(name: string): this {
        this.publicConfig.pluralApiName = name;
        return this;
    }

    group(slug: string): this {
        this.publicConfig.group = slug;
        return this;
    }

    icon(icon: string | CmsIcon): this {
        this.publicConfig.icon = Icon.from(icon);
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

    constructor(registry: any) {
        super(registry);
        this.layoutBuilder = new LayoutBuilder();
    }

    layout(layoutOrBuilder: string[][] | ((builder: LayoutBuilder) => void)): this {
        if (Array.isArray(layoutOrBuilder)) {
            // Replace layout with array
            this.layoutBuilder.setLayout(layoutOrBuilder);
        } else {
            // Queue the modifier callback
            this.layoutBuilder.addModifier(layoutOrBuilder);
        }
        return this;
    }

    build() {
        if (!this.config.modelId) {
            throw new Error("modelId is required");
        }
        if (!this.config.name) {
            throw new Error("name is required");
        }
        if (this.fieldBuildersMap.size === 0) {
            throw new Error("fields are required");
        }
        if (!this.publicConfig.group) {
            throw new Error("group is required");
        }

        // Build all fields from field builders
        const fields = Array.from(this.fieldBuildersMap.values()).map(builder => builder.build());

        return createModelPlugin(
            {
                modelId: this.config.modelId,
                name: this.config.name,
                singularApiName:
                    this.publicConfig.singularApiName || createApiName(this.config.name),
                pluralApiName:
                    this.publicConfig.pluralApiName || createPluralApiName(this.config.name),
                group: this.publicConfig.group,
                icon: this.publicConfig.icon ?? null,
                description: this.publicConfig.description || null,
                titleFieldId: this.publicConfig.titleFieldId ?? "",
                descriptionFieldId: this.publicConfig.descriptionFieldId,
                imageFieldId: this.publicConfig.imageFieldId,
                layout: this.layoutBuilder.build(),
                fields,
                tags: this.getTags()
            },
            { validateLayout: false }
        );
    }
}
