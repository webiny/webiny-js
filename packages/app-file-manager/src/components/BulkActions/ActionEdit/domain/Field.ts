import { CmsModelField } from "@webiny/app-headless-cms-common/types/model";

export type FieldRaw = CmsModelField;

export enum OperatorType {
    OVERRIDE = "OVERRIDE",
    APPEND = "APPEND",
    REMOVE = "REMOVE"
}

export interface FieldDTO {
    label: string;
    value: string;
    operators: OperatorDTO[];
    raw: FieldRaw;
}

export class Field {
    public readonly label: string;
    public readonly value: string;
    public readonly operators: Operator[];
    public readonly raw: FieldRaw;

    static createFromRaw(field: FieldRaw) {
        const label = field.label;
        const value = field.fieldId;
        const operators = Operator.createFromField(field);
        return new Field(label, value, operators, field);
    }

    private constructor(label: string, value: string, operators: Operator[], renderer: FieldRaw) {
        this.label = label;
        this.value = value;
        this.operators = operators;
        this.raw = renderer;
    }
}

export interface OperatorDTO {
    label: string;
    value: string;
}

export class Operator {
    public readonly label: string;
    public readonly value: string;

    static createFrom(rawData: OperatorDTO) {
        return new Operator(rawData.label, rawData.value);
    }

    static createFromField(field: CmsModelField) {
        const operators = [
            {
                label: "Override existing values",
                value: OperatorType.OVERRIDE
            },
            {
                label: "Clear all existing values",
                value: OperatorType.REMOVE
            }
        ];

        if (field.multipleValues) {
            operators.push({
                label: "Append to existing values",
                value: OperatorType.APPEND
            });
        }

        return operators.map(operator => this.createFrom(operator));
    }

    private constructor(label: string, value: string) {
        this.label = label;
        this.value = value;
    }
}
