export interface JsonSchema {
    $schema?: string;
    type?: string | string[];
    properties?: Record<string, JsonSchema>;
    required?: string[];
    items?: JsonSchema;
    enum?: (string | number | boolean)[];
    oneOf?: JsonSchema[];
    const?: unknown;
    description?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    format?: string;
    additionalProperties?: boolean | JsonSchema;
    discriminator?: { propertyName: string };
}

export interface CmsModelToJsonSchemaOptions {
    includeHiddenFields?: boolean;
}
