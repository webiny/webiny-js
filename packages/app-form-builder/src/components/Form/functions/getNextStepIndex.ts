import * as validators from "~/validators";

import { FbFormCondition, FbFormRule, FbFormRuleAction } from "~/types";

interface Props {
    formData: Record<string, any>;
    rule: FbFormRule;
}

const includesValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return validators.includes(fieldValue, filterValue);
};

const startsWithValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return validators.startsWith(fieldValue, filterValue);
};

const endsWithValidator = (filterValue: string, fieldValue: string) => {
    if (fieldValue === null) {
        return;
    }

    return validators.endsWith(fieldValue, filterValue);
};

const isValidator = (filterValue: string, fieldValue: string | string[]) => {
    if (fieldValue === null) {
        return;
    }

    return validators.is(fieldValue, filterValue);
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
        return validators.gt(fieldValue, filterValue);
    } else {
        return validators.gt(fieldValue, filterValue, true);
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
        return validators.lt(fieldValue, filterValue);
    } else {
        return validators.lt(fieldValue, filterValue, true);
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
        return validators.gt(Date.parse(fieldValue), Date.parse(filterValue));
    } else {
        return validators.gt(Date.parse(fieldValue), Date.parse(filterValue), true);
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
        return validators.lt(Date.parse(fieldValue), Date.parse(filterValue));
    } else {
        return validators.lt(Date.parse(fieldValue), Date.parse(filterValue), true);
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
    if (rule.matchAll) {
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
    let action: FbFormRuleAction = {
        type: "",
        value: ""
    };
    rules.forEach(rule => {
        if (checkIfConditionsMet({ formData, rule })) {
            action = rule.action;
            return;
        }
    });

    return action;
};
