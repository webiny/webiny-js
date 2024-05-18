import {
    Condition,
    ConditionDTO,
    Field,
    FieldDTO,
    Predefined,
    PredefinedDTO,
    Type,
    FieldType,
    Value,
    Settings,
    SettingsDTO
} from "./Field";

export class FieldMapper {
    static toDTO(configuration: Field[]): FieldDTO[] {
        return configuration.map(field => {
            return {
                label: field.label,
                value: ValueMapper.toDTO(field.value),
                conditions: ConditionMapper.toDTO(field.conditions),
                predefined: PredefinedMapper.toDTO(field.predefined),
                type: TypeMapper.toDTO(field.type),
                settings: SettingsMapper.toDTO(field.settings)
            };
        });
    }
}

export class ValueMapper {
    static toDTO(value: Value): string {
        return value.value;
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
    static toDTO(type: Type): FieldType {
        return type.value;
    }
}

export class SettingsMapper {
    static toDTO(settings: Settings): SettingsDTO {
        return {
            modelIds: settings.modelIds
        };
    }
}
