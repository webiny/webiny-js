import includes from "lodash/includes";
import endsWith from "lodash/endsWith";
import startsWith from "lodash/startsWith";
import eq from "lodash/eq";
import lte from "lodash/lte";
import lt from "lodash/lt";
import gte from "lodash/gte";
import gt from "lodash/gt";

import { FbFormRule, FbFormCondition } from "~/types";

interface Props {
    formData: Record<string, any>;
    rule: FbFormRule;
}

const includesValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return includes(fieldValue, filterValue);
};

const startsWithValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return startsWith(fieldValue, filterValue);
};

const endsWithValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return endsWith(fieldValue, filterValue);
};

const isValidator = (filterValue: string, fieldValue: string | string[]) => {
    if (fieldValue === null) {
        return;
    }

    // This is check for checkboxes.
    if (typeof fieldValue === "object") {
        return fieldValue.includes(filterValue);
    } else {
        return eq(fieldValue, filterValue);
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

    if (!equal) {
        return gt(fieldValue, filterValue);
    } else {
        return gte(fieldValue, filterValue);
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

    if (!equal) {
        return lt(filterValue, filterValue);
    } else {
        return lte(fieldValue, filterValue);
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

    if (!equal) {
        return gt(Date.parse(fieldValue), Date.parse(filterValue));
    } else {
        return gte(Date.parse(fieldValue), Date.parse(filterValue));
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

    if (!equal) {
        return lt(Date.parse(fieldValue), Date.parse(filterValue));
    } else {
        return lte(Date.parse(fieldValue), Date.parse(filterValue));
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
