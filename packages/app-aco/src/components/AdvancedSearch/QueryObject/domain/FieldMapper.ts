import {
    Condition,
    ConditionDTO,
    Field,
    FieldDTO,
    Predefined,
    PredefinedDTO,
    Type,
    FieldType
} from "./Field";

export class FieldMapper {
    static toDTO(configuration: Field[]): FieldDTO[] {
        return configuration.map(field => {
            return {
                label: field.label,
                value: field.value,
                conditions: ConditionMapper.toDTO(field.conditions),
                predefined: PredefinedMapper.toDTO(field.predefined),
                type: TypeMapper.toTDO(field.type)
            };
        });
    }
}

export class ConditionMapper {
    static toDTO(conditions: Condition[]): ConditionDTO[] {
        return conditions.map(condition => ({
            value: condition.value || "",
            label: condition.label || ""
        }));
    }
}

export class PredefinedMapper {
    static toDTO(predefineds: Predefined[]): PredefinedDTO[] {
        return predefineds.map(predefined => ({
            value: predefined.value || "",
            label: predefined.label || ""
        }));
    }
}

export class TypeMapper {
    static toTDO(type: Type): FieldType {
        return type.value;
    }
}
