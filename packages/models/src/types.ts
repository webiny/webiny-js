export interface Attribute {
    name: string;
    /**
     * String type is here so users can add their own types if required.
     */
    type: "string" | "number" | "boolean" | "object" | "list" | "datetime" | string;
}
