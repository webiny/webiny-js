import type { Operator } from "./evaluateExpression.js";

export interface OperatorOption {
    value: Operator;
    label: string;
}

const NUMERIC_OPERATORS: OperatorOption[] = [
    { value: "==", label: "Equals" },
    { value: "!=", label: "Not equals" },
    { value: ">", label: "Greater than" },
    { value: "<", label: "Less than" },
    { value: ">=", label: "Greater or equal" },
    { value: "<=", label: "Less or equal" },
    { value: "isEmpty", label: "Is empty" }
];

const TEXT_OPERATORS: OperatorOption[] = [
    { value: "==", label: "Equals" },
    { value: "!=", label: "Not equals" },
    { value: "contains", label: "Contains" },
    { value: "startsWith", label: "Starts with" },
    { value: "endsWith", label: "Ends with" },
    { value: "isEmpty", label: "Is empty" }
];

const BOOLEAN_OPERATORS: OperatorOption[] = [
    { value: "==", label: "Equals" },
    { value: "!=", label: "Not equals" }
];

const FILE_OPERATORS: OperatorOption[] = [{ value: "isEmpty", label: "Is empty" }];

const DEFAULT_OPERATORS: OperatorOption[] = [
    { value: "==", label: "Equals" },
    { value: "!=", label: "Not equals" },
    { value: "isEmpty", label: "Is empty" }
];

const OPERATORS_BY_TYPE: Record<string, OperatorOption[]> = {
    number: NUMERIC_OPERATORS,
    datetime: NUMERIC_OPERATORS,
    text: TEXT_OPERATORS,
    "long-text": TEXT_OPERATORS,
    boolean: BOOLEAN_OPERATORS,
    file: FILE_OPERATORS
};

export function getOperatorOptions(fieldType: string): OperatorOption[] {
    return OPERATORS_BY_TYPE[fieldType] ?? DEFAULT_OPERATORS;
}

/**
 * Operators that don't need a value input (the value is implicit).
 */
export const VALUE_HIDDEN_OPERATORS: Set<Operator> = new Set(["isEmpty"]);
