import { CmsModelField } from "@webiny/api-headless-cms/types";

export type FieldRaw = Pick<
    CmsModelField,
    "id" | "type" | "label" | "multipleValues" | "predefinedValues" | "settings"
>;

export enum TypeEnum {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    TIME = "time",
    DATETIME_WITH_TIMEZONE = "dateTimeWithTimezone",
    DATETIME_WITHOUT_TIMEZONE = "dateTimeWithOutTimezone",
    MULTIPLE_VALUES = "multipleValues"
}

export interface ConditionDTO {
    label: string;
    value: string;
}

export interface PredefinedDTO {
    label: string;
    value: string;
}

export interface TypeDTO {
    value: TypeEnum;
}

export interface FieldDTO {
    label: string;
    value: string;
    conditions: ConditionDTO[];
    type: TypeDTO;
    predefined: PredefinedDTO[];
}

export class Field {
    public readonly label: string;
    public readonly value: string;
    public readonly type: Type;
    public readonly conditions: Condition[];
    public readonly predefined: Predefined[];

    static createFromRaw(rawData: FieldRaw) {
        const label = rawData.label;
        const value = rawData.id;
        const type = Type.createFrom(rawData);

        const conditions = this.createConditionsFromRaw(rawData).map(dto =>
            Condition.createFrom(dto)
        );

        const rawPredefined = rawData.predefinedValues?.values || [];
        const predefined = rawPredefined.map(predefined => Predefined.createFrom(predefined));

        return new Field(label, value, type, conditions, predefined);
    }

    private constructor(
        label: string,
        value: string,
        type: Type,
        conditions: Condition[],
        predefined: Predefined[]
    ) {
        this.label = label;
        this.value = value;
        this.type = type;
        this.predefined = predefined;
        this.conditions = conditions;
    }

    private static createConditionsFromRaw(field: FieldRaw): ConditionDTO[] {
        switch (field.type) {
            case "text": {
                if (field.predefinedValues?.enabled) {
                    return [
                        {
                            label: "contains",
                            value: "_in"
                        },
                        {
                            label: "doesn't contain",
                            value: "_not_in"
                        }
                    ];
                }

                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "contains",
                        value: "_contains"
                    },
                    {
                        label: "starts with",
                        value: "_startsWith"
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    },
                    {
                        label: "doesn't contain",
                        value: "_not_contains"
                    },
                    {
                        label: "doesn't start with",
                        value: "_not_startsWith"
                    }
                ];
            }

            case "long-text": {
                return [
                    {
                        label: "contains",
                        value: "_contains"
                    },
                    {
                        label: "doesn't contain",
                        value: "_not_contains"
                    }
                ];
            }

            case "boolean": {
                return [
                    {
                        label: "is",
                        value: " "
                    },
                    {
                        label: "is not",
                        value: "_not"
                    }
                ];
            }

            case "number": {
                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    },
                    {
                        label: "is less than",
                        value: "_lt"
                    },
                    {
                        label: "is less or equal to",
                        value: "_lte"
                    },
                    {
                        label: "is greater than",
                        value: "_gt"
                    },
                    {
                        label: "is greater or equal to",
                        value: "_gte"
                    }
                ];
            }

            case "datetime": {
                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    },
                    {
                        label: "is before",
                        value: "_lt"
                    },
                    {
                        label: "is before or equal to",
                        value: "_lte"
                    },
                    {
                        label: "is after",
                        value: "_gt"
                    },
                    {
                        label: "is after or equal to",
                        value: "_gte"
                    }
                ];
            }

            case "ref": {
                return [
                    {
                        label: "is equal to",
                        value: " "
                    },
                    {
                        label: "is not equal to",
                        value: "_not"
                    }
                ];
            }

            default: {
                return [];
            }
        }
    }
}

export class Condition {
    public readonly label: string;
    public readonly value: string;

    static createFrom(rawData: ConditionDTO) {
        return new Condition(rawData.label, rawData.value);
    }

    private constructor(label: string, value: string) {
        this.label = label;
        this.value = value;
    }
}

export class Predefined {
    public readonly label: string;
    public readonly value: string;

    static createFrom(rawData: PredefinedDTO) {
        return new Predefined(rawData.label, rawData.value);
    }

    private constructor(label: string, value: string) {
        this.label = label;
        this.value = value;
    }
}

export class Type {
    public readonly value: TypeEnum;

    static createFrom(rawData: FieldRaw) {
        if (rawData.settings?.type === TypeEnum.DATETIME_WITH_TIMEZONE) {
            return new Type(TypeEnum.DATETIME_WITH_TIMEZONE);
        }

        if (rawData.settings?.type === TypeEnum.DATETIME_WITHOUT_TIMEZONE) {
            return new Type(TypeEnum.DATETIME_WITHOUT_TIMEZONE);
        }

        if (rawData?.multipleValues && rawData.predefinedValues?.enabled) {
            return new Type(TypeEnum.MULTIPLE_VALUES);
        }

        if (rawData.type === "datetime") {
            const value = rawData.settings?.type === TypeEnum.TIME ? TypeEnum.TIME : TypeEnum.DATE;
            return new Type(value);
        }

        if (rawData.type === TypeEnum.BOOLEAN) {
            return new Type(TypeEnum.BOOLEAN);
        }

        if (rawData.type === TypeEnum.NUMBER) {
            return new Type(TypeEnum.NUMBER);
        }

        return new Type(TypeEnum.TEXT);
    }

    private constructor(value: TypeEnum) {
        this.value = value;
    }
}
