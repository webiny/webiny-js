import type {
    CmsModel,
    CmsModelAst,
    CmsModelField,
    CmsModelFieldAstNode,
    CmsModelFieldAstNodeCollection,
    CmsModelFieldAstNodeField,
    CmsModelFieldValidation
} from "~/types/index.js";
import type { JsonSchema, CmsModelToJsonSchemaOptions } from "./types.js";

interface ValidationConstraints {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    format?: string;
}

interface ConvertedChildren {
    properties: Record<string, JsonSchema>;
    required: string[];
}

export class CmsModelToJsonSchemaConverter {
    private readonly options: Required<CmsModelToJsonSchemaOptions>;

    constructor(options?: CmsModelToJsonSchemaOptions) {
        this.options = {
            includeHiddenFields: false,
            ...options
        };
    }

    convert(ast: CmsModelAst, model: Pick<CmsModel, "name" | "description">): JsonSchema {
        const { properties, required } = this.convertChildren(ast.children);

        const schema: JsonSchema = {
            type: "object",
            properties
        };

        if (required.length > 0) {
            schema.required = required;
        }

        const description = this.buildModelDescription(model);
        if (description) {
            schema.description = description;
        }

        return schema;
    }

    private convertNode(node: CmsModelFieldAstNode): JsonSchema | null {
        if (node.type === "collection") {
            return null;
        }

        const field = node.field;

        if (this.isHidden(field)) {
            return null;
        }

        let schema: JsonSchema;

        if (this.childrenAreCollections(node)) {
            schema = this.convertDynamicZone(node);
        } else if (node.children.length > 0) {
            const { properties, required } = this.convertChildren(node.children);
            schema = { type: "object", properties };
            if (required.length > 0) {
                schema.required = required;
            }
        } else {
            schema = this.convertFieldByType(field);
        }

        const description = this.buildFieldDescription(field);
        if (description) {
            schema.description = schema.description
                ? `${description}. ${schema.description}`
                : description;
        }

        if (field.list) {
            return this.wrapAsList(schema, field);
        }

        return schema;
    }

    private convertChildren(children: CmsModelFieldAstNode[]): ConvertedChildren {
        const properties: Record<string, JsonSchema> = {};
        const required: string[] = [];

        for (const child of children) {
            if (child.type === "collection") {
                continue;
            }

            const schema = this.convertNode(child);
            if (schema === null) {
                continue;
            }

            properties[child.field.fieldId] = schema;

            const constraints = this.extractValidationConstraints(child.field.validation || []);
            if (constraints.required) {
                required.push(child.field.fieldId);
            }
        }

        return { properties, required };
    }

    private convertFieldByType(field: CmsModelField): JsonSchema {
        switch (field.type) {
            case "text":
                return this.convertTextField(field);
            case "long-text":
                return this.convertLongTextField(field);
            case "rich-text":
                return this.convertRichTextField(field);
            case "number":
                return this.convertNumberField(field);
            case "boolean":
                return this.convertBooleanField();
            case "datetime":
                return this.convertDateTimeField(field);
            case "file":
                return this.convertFileField(field);
            case "ref":
                return this.convertRefField(field);
            case "json":
                return { type: "object", additionalProperties: true };
            default:
                return { type: "object", additionalProperties: true };
        }
    }

    private convertTextField(field: CmsModelField): JsonSchema {
        const schema: JsonSchema = { type: "string" };
        this.applyPredefinedValues(schema, field);
        this.applyValidationConstraints(schema, field.validation);
        return schema;
    }

    private convertLongTextField(field: CmsModelField): JsonSchema {
        const schema: JsonSchema = { type: "string" };
        this.applyValidationConstraints(schema, field.validation);
        return schema;
    }

    private convertRichTextField(_field: CmsModelField): JsonSchema {
        return {
            type: "object",
            properties: {
                tool: { const: "textToLexical" },
                params: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description:
                                "Rich text content as HTML markup. Use semantic HTML tags: <h1>-<h6>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <a>, <blockquote>."
                        }
                    },
                    required: ["text"]
                }
            },
            required: ["tool", "params"]
        };
    }

    private convertNumberField(field: CmsModelField): JsonSchema {
        const schema: JsonSchema = { type: "number" };
        this.applyPredefinedValues(schema, field, true);
        this.applyValidationConstraints(schema, field.validation);
        return schema;
    }

    private convertBooleanField(): JsonSchema {
        return { type: "boolean" };
    }

    private convertDateTimeField(field: CmsModelField): JsonSchema {
        const schema: JsonSchema = { type: "string" };

        const dateType = field.settings?.type;
        switch (dateType) {
            case "date":
                schema.format = "date";
                break;
            case "time":
                schema.format = "time";
                break;
            case "dateTimeWithTimezone":
                schema.format = "date-time";
                break;
            case "dateTimeWithoutTimezone":
                schema.format = "date-time";
                schema.description = "Date and time without timezone (ISO 8601 format).";
                break;
            default:
                schema.format = "date-time";
                break;
        }

        return schema;
    }

    private convertFileField(field: CmsModelField): JsonSchema {
        const imagesOnly = field.settings?.imagesOnly === true;
        return {
            type: "object",
            properties: {
                tool: { const: "cmsResolveImage" },
                params: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: imagesOnly
                                ? "Image file ID obtained from listImagesByTag."
                                : "File ID obtained from listImagesByTag."
                        }
                    },
                    required: ["id"]
                }
            },
            required: ["tool", "params"]
        };
    }

    private convertRefField(field: CmsModelField): JsonSchema {
        const models = field.settings?.models;
        const modelIds =
            Array.isArray(models) && models.length > 0
                ? models.map((m: { modelId: string }) => m.modelId)
                : [];

        const schema: JsonSchema = {
            type: "object",
            properties: {
                entryId: { type: "string", description: "ID of the referenced entry." },
                modelId: {
                    type: "string",
                    description: "Model ID of the referenced entry."
                }
            },
            required: ["entryId", "modelId"]
        };

        if (modelIds.length > 0) {
            const modelIdProp = schema.properties!["modelId"];
            modelIdProp.enum = modelIds;
        }

        return schema;
    }

    private convertDynamicZone(node: CmsModelFieldAstNodeField): JsonSchema {
        const collections = node.children.filter(
            (child): child is CmsModelFieldAstNodeCollection => child.type === "collection"
        );

        const oneOf = collections.map(collection => this.convertCollection(collection));

        const schema: JsonSchema = { oneOf };

        if (collections.length > 0) {
            schema.discriminator = { propertyName: collections[0].collection.discriminator };
        }

        return schema;
    }

    private convertCollection(collection: CmsModelFieldAstNodeCollection): JsonSchema {
        const { properties, required } = this.convertChildren(collection.children);

        properties[collection.collection.discriminator] = {
            const: collection.collection.id
        };

        const allRequired = [collection.collection.discriminator, ...required];

        const schema: JsonSchema = {
            type: "object",
            properties,
            required: allRequired
        };

        if (collection.collection.name) {
            schema.description = collection.collection.name;
        }

        return schema;
    }

    private buildFieldDescription(field: CmsModelField): string | undefined {
        const parts: string[] = [];

        if (field.label) {
            parts.push(field.label);
        }

        if (field.description) {
            parts.push(field.description);
        }

        if (field.help) {
            parts.push(field.help);
        }

        if (parts.length === 0) {
            return undefined;
        }

        return parts.join(". ");
    }

    private buildModelDescription(
        model: Pick<CmsModel, "name" | "description">
    ): string | undefined {
        const parts: string[] = [];

        if (model.name) {
            parts.push(model.name);
        }

        if (model.description) {
            parts.push(model.description);
        }

        if (parts.length === 0) {
            return undefined;
        }

        return parts.join(". ");
    }

    private extractValidationConstraints(
        validations: CmsModelFieldValidation[] | undefined
    ): ValidationConstraints {
        const constraints: ValidationConstraints = { required: false };

        if (!validations) {
            return constraints;
        }

        for (const v of validations) {
            switch (v.name) {
                case "required":
                    constraints.required = true;
                    break;
                case "minLength":
                    if (v.settings?.value !== undefined) {
                        constraints.minLength = Number(v.settings.value);
                    }
                    break;
                case "maxLength":
                    if (v.settings?.value !== undefined) {
                        constraints.maxLength = Number(v.settings.value);
                    }
                    break;
                case "gte":
                    if (v.settings?.value !== undefined) {
                        constraints.minimum = Number(v.settings.value);
                    }
                    break;
                case "lte":
                    if (v.settings?.value !== undefined) {
                        constraints.maximum = Number(v.settings.value);
                    }
                    break;
                case "pattern":
                    if (v.settings?.preset === "email") {
                        constraints.format = "email";
                    } else if (v.settings?.preset === "url") {
                        constraints.format = "uri";
                    } else if (v.settings?.value !== undefined) {
                        constraints.pattern = String(v.settings.value);
                    }
                    break;
            }
        }

        return constraints;
    }

    private applyValidationConstraints(
        schema: JsonSchema,
        validations: CmsModelFieldValidation[]
    ): void {
        const constraints = this.extractValidationConstraints(validations);

        if (constraints.minLength !== undefined) {
            schema.minLength = constraints.minLength;
        }
        if (constraints.maxLength !== undefined) {
            schema.maxLength = constraints.maxLength;
        }
        if (constraints.minimum !== undefined) {
            schema.minimum = constraints.minimum;
        }
        if (constraints.maximum !== undefined) {
            schema.maximum = constraints.maximum;
        }
        if (constraints.pattern !== undefined) {
            schema.pattern = constraints.pattern;
        }
        if (constraints.format !== undefined) {
            schema.format = constraints.format;
        }
    }

    private applyPredefinedValues(
        schema: JsonSchema,
        field: CmsModelField,
        parseAsNumber = false
    ): void {
        if (field.predefinedValues?.enabled !== true) {
            return;
        }

        const values = field.predefinedValues.values;
        if (!Array.isArray(values) || values.length === 0) {
            return;
        }

        schema.enum = values.map(v => (parseAsNumber ? Number(v.value) : v.value));
    }

    private wrapAsList(schema: JsonSchema, field: CmsModelField): JsonSchema {
        const listSchema: JsonSchema = {
            type: "array",
            items: schema
        };

        for (const v of field.listValidation || []) {
            if (v.name === "minLength" && v.settings?.value !== undefined) {
                listSchema.minLength = Number(v.settings.value);
            }
            if (v.name === "maxLength" && v.settings?.value !== undefined) {
                listSchema.maxLength = Number(v.settings.value);
            }
        }

        return listSchema;
    }

    private isHidden(field: CmsModelField): boolean {
        if (this.options.includeHiddenFields) {
            return false;
        }

        return field.renderer?.name === "hidden";
    }

    private childrenAreCollections(
        node: CmsModelFieldAstNodeField
    ): node is CmsModelFieldAstNodeField & { children: CmsModelFieldAstNodeCollection[] } {
        return node.children.length > 0 && node.children.every(c => c.type === "collection");
    }
}
