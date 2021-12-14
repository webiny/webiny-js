import {
    CmsContentModelCreateInput,
    CmsContentModelFieldInput,
    CmsContentModelUpdateInput,
    CmsGroup,
    CmsModelField
} from "~/applications/headlessCms/graphql/types";
import WebinyError from "@webiny/error";

export interface BuildCreateParams {
    group: CmsGroup;
}

export interface BuildUpdateParams {
    group: CmsGroup;
}

export interface Params {
    modelId: string;
    name: string;
    group?: CmsGroup;
    description?: string;
}

export class ModelBuilder {
    private readonly params: Params;
    private readonly fields: CmsModelField[] = [];
    private titleFieldId: string;

    public get name(): string {
        return this.params.name;
    }

    public get modelId(): string {
        return this.params.modelId;
    }

    public constructor(params: Params) {
        this.params = params;
    }

    public setGroup(group: CmsGroup): void {
        this.params.group = group;
    }

    public buildCreateInputData(params?: BuildCreateParams): CmsContentModelCreateInput {
        return {
            name: this.params.name,
            modelId: this.params.modelId,
            group: this.getGroupId(params?.group),
            description: this.getDescription()
        };
    }

    public buildUpdateInputData(params?: BuildUpdateParams): CmsContentModelUpdateInput {
        return {
            name: this.params.name,
            description: this.getDescription(),
            group: this.getGroupId(params?.group),
            titleFieldId: this.getTitleFieldId(),
            fields: this.getFieldsInput(),
            layout: this.getLayout()
        };
    }

    public setTitleFieldId(field: CmsModelField | string): ModelBuilder {
        this.titleFieldId = typeof field === "string" ? field : field.fieldId;
        return this;
    }

    public addField(field: CmsModelField): ModelBuilder {
        this.fields.push(field);
        return this;
    }

    public hasFields(): boolean {
        return this.fields.length > 0;
    }

    public getFields(): CmsModelField[] {
        return this.fields;
    }

    private getDescription(): string {
        return this.params.description || `Generated model "${this.params.name}"`;
    }

    private getGroupId(group?: CmsGroup): string {
        if (group) {
            return group.id;
        } else if (this.params.group) {
            return this.params.group.id;
        }
        throw new WebinyError(`Missing group for model "${this.modelId}".`, "MODEL_GROUP_ERROR", {
            ...this.params
        });
    }

    private getTitleFieldId(): string {
        if (!this.titleFieldId) {
            const field = this.fields.find(
                field => field.type === "text" && field.multipleValues === false
            );
            if (!field) {
                throw new WebinyError(
                    `Could not determine "titleFieldId" for model "${this.params.modelId}".`,
                    "MODEL_TITLE_FIELD_ERROR",
                    {
                        ...this.params
                    }
                );
            }
            this.titleFieldId = field.fieldId;
        }
        return this.titleFieldId;
    }

    private getFieldsInput(): CmsContentModelFieldInput[] {
        return this.fields.map(field => {
            return {
                id: field.id,
                fieldId: field.fieldId,
                type: field.type,
                multipleValues: field.multipleValues,
                label: field.label,
                settings: field.settings,
                helpText: field.helpText,
                validation: field.validation || [],
                listValidation: field.listValidation || [],
                placeholderText: field.placeholderText,
                predefinedValues: field.predefinedValues,
                renderer: field.renderer
            };
        });
    }

    private getLayout(): string[][] {
        return this.fields.map(field => {
            return [field.fieldId];
        });
    }
}
