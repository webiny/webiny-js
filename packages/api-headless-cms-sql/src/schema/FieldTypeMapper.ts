import type { SqlColumnType } from "./abstractions.js";
import { FieldTypeMapper } from "./abstractions.js";

class FieldTypeMapperImpl implements FieldTypeMapper.Interface {
    private readonly mapping: Record<string, SqlColumnType> = {
        text: "text",
        "long-text": "text",
        "rich-text": "text",
        number: "float",
        boolean: "boolean",
        datetime: "timestamp",
        file: "json",
        ref: "json",
        object: "json",
        dynamicZone: "json",
        json: "json",
        "searchable-json": "json",
        location: "json"
    };

    public mapFieldType(fieldType: string, settings?: Record<string, unknown>): SqlColumnType {
        if (fieldType === "datetime" && settings?.type === "date") {
            return "date";
        }

        return this.mapping[fieldType] ?? "text";
    }
}

export const FieldTypeMapperImplementation = FieldTypeMapper.createImplementation({
    implementation: FieldTypeMapperImpl,
    dependencies: []
});
