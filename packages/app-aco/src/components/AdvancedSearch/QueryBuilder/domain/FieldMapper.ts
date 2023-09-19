import { Field, FieldDTO } from "./Field";

export class FieldMapper {
    static toDTO(configuration: Field[]): FieldDTO[] {
        return configuration.map(field => {
            return {
                label: field.label,
                value: field.value,
                conditions: field.conditions,
                predefined: field.predefined,
                type: field.type
            };
        });
    }
}
