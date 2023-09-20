import { Field, FieldDTO } from "./Field";

export class FieldMapper {
    static toDTO(configuration: Field[]): FieldDTO[] {
        return configuration.map(field => {
            return {
                label: field.label,
                value: field.value,
                conditions: field.conditions.map(condition => ({
                    value: condition.value || "",
                    label: condition.label || ""
                })),
                predefined: field.predefined.map(predefined => ({
                    value: predefined.value || "",
                    label: predefined.label || ""
                })),
                type: field.type.value
            };
        });
    }
}
