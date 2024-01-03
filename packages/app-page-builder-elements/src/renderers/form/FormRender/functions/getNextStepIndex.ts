import { validation } from "@webiny/validation";

import { FbFormCondition, FbFormRule } from "~/types";

interface Props {
    formData: Record<string, any>;
    rule: FbFormRule;
}

const includesValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return fieldValue.includes(filterValue);
};

const startsWithValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    // Need to use try catch block because without it validation will throw and error,
    // so user won't be able to interact with page.
    // Same applies to all validation methods below.
    try {
        return validation.validateSync(fieldValue, `starts:${filterValue}`);
    } catch {
        return;
    }
};

const endsWithValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    try {
        return validation.validateSync(fieldValue, `ends:${filterValue}`);
    } catch {
        return;
    }
};

const isValidator = (filterValue: string, fieldValue: string | string[]) => {
    if (fieldValue === null) {
        return;
    }

    try {
        // This is check for checkboxes.
        if (typeof fieldValue === "object") {
            return fieldValue.includes(filterValue);
        } else {
            return validation.validateSync(fieldValue, `eq:${filterValue}`);
        }
    } catch {
        return;
    }
};

const gtValidator = ({
    filterValue,
    fieldValue,
    equal = false
}: {
    filterValue: string;
    fieldValue: string;
    equal?: boolean;
}) => {
    if (fieldValue === null) {
        return;
    }

    try {
        if (!equal) {
            return validation.validateSync(fieldValue, `gt:${filterValue}`);
        } else {
            return validation.validateSync(fieldValue, `gte:${filterValue}`);
        }
    } catch {
        return;
    }
};

const ltValidator = ({
    filterValue,
    fieldValue,
    equal = false
}: {
    filterValue: string;
    fieldValue: string;
    equal?: boolean;
}) => {
    if (fieldValue === null) {
        return;
    }

    try {
        if (!equal) {
            return validation.validateSync(fieldValue, `lt:${filterValue}`);
        } else {
            return validation.validateSync(fieldValue, `lte:${filterValue}`);
        }
    } catch {
        return;
    }
};

const timeGtValidator = ({
    filterValue,
    fieldValue,
    equal = false
}: {
    filterValue: string;
    fieldValue: string;
    equal?: boolean;
}) => {
    if (fieldValue === null) {
        return;
    }

    try {
        if (!equal) {
            return validation.validateSync(Date.parse(fieldValue), `gt:${Date.parse(filterValue)}`);
        } else {
            return validation.validateSync(
                Date.parse(fieldValue),
                `gte:${Date.parse(filterValue)}`
            );
        }
    } catch {
        return;
    }
};

const timeLtValidator = ({
    filterValue,
    fieldValue,
    equal = false
}: {
    filterValue: string;
    fieldValue: string;
    equal?: boolean;
}) => {
    if (fieldValue === null) {
        return;
    }

    try {
        if (!equal) {
            return validation.validateSync(Date.parse(fieldValue), `lt:${Date.parse(filterValue)}`);
        } else {
            return validation.validateSync(
                Date.parse(fieldValue),
                `lte:${Date.parse(filterValue)}`
            );
        }
    } catch {
        return;
    }
};

const checkCondition = (condition: FbFormCondition, fieldValue: string) => {
    switch (condition.filterType) {
        case "contains":
            return includesValidator(condition.filterValue, fieldValue);
        case "not_contains":
            return !includesValidator(condition.filterValue, fieldValue);
        case "starts":
            return startsWithValidator(condition.filterValue, fieldValue);
        case "not_starts":
            return !startsWithValidator(condition.filterValue, fieldValue);
        case "ends":
            return endsWithValidator(condition.filterValue, fieldValue);
        case "not_ends":
            return !endsWithValidator(condition.filterValue, fieldValue);
        case "is":
            return isValidator(condition.filterValue, fieldValue);
        case "not_is":
            return !isValidator(condition.filterValue, fieldValue);
        case "selected":
            return isValidator(condition.filterValue, fieldValue);
        case "not_selected":
            return !isValidator(condition.filterValue, fieldValue);
        case "gt":
            return gtValidator({ filterValue: condition.filterValue, fieldValue });
        case "gte":
            return gtValidator({ filterValue: condition.filterValue, fieldValue, equal: true });
        case "lt":
            return ltValidator({ filterValue: condition.filterValue, fieldValue });
        case "lte":
            return ltValidator({ filterValue: condition.filterValue, fieldValue, equal: true });
        case "time_gt":
            return timeGtValidator({ filterValue: condition.filterValue, fieldValue });
        case "time_gte":
            return timeGtValidator({ filterValue: condition.filterValue, fieldValue, equal: true });
        case "time_lt":
            return timeLtValidator({ filterValue: condition.filterValue, fieldValue });
        case "time_lte":
            return timeLtValidator({ filterValue: condition.filterValue, fieldValue, equal: true });
        default:
            return false;
    }
};

export const checkIfConditionsMet = ({ formData, rule }: Props) => {
    if (rule.chain === "matchAll") {
        let isValid = true;

        rule.conditions.forEach(condition => {
            if (!checkCondition(condition, formData?.[condition.fieldName])) {
                isValid = false;
                return;
            }
        });

        return isValid;
    } else {
        let isValid = false;

        rule.conditions.forEach(condition => {
            if (checkCondition(condition, formData?.[condition.fieldName])) {
                isValid = true;
                return;
            }
        });

        return isValid;
    }
};

interface GetNextStepIndexProps {
    formData: Record<string, any>;
    rules: FbFormRule[];
}

export default ({ formData, rules }: GetNextStepIndexProps) => {
    let nextStepIndex = "";
    rules.forEach(rule => {
        if (checkIfConditionsMet({ formData, rule })) {
            nextStepIndex = rule.action;
            return;
        }
    });

    return nextStepIndex;
};
