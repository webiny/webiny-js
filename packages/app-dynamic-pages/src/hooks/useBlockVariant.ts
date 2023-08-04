import { useContext } from "react";
import { DynamicSourceContext } from "~/contexts/DynamicSource";
import { Filter } from "~/components/Settings/FilterSettings";
import { PbElement } from "~/types";

import get from "lodash/get";
import gt from "lodash/gt";
import gte from "lodash/gte";
import lt from "lodash/lt";
import lte from "lodash/lte";
import isEmpty from "lodash/isEmpty";

const gtValidator = (condition: Filter, value: string, isGte = false) => {
    if (!value) {
        return;
    }

    const timeValidator = /(^\d*:\d*)/gm;

    if (condition.value.match(timeValidator)) {
        const conditionValue = new Date(condition.value);
        const dateValue = new Date(value);

        return isGte ? gte(dateValue, conditionValue) : gt(dateValue, conditionValue);
    }

    return isGte ? gte(value, condition.value) : gt(value, condition.value);
};

const ltValidator = (condition: Filter, value: string, isLte = false) => {
    if (!value) {
        return;
    }

    const timeValidator = /(^\d*:\d*)/gm;

    if (condition.value.match(timeValidator)) {
        const conditionValue = new Date(condition.value);
        const dateValue = new Date(value);

        return isLte ? lte(dateValue, conditionValue) : lt(dateValue, conditionValue);
    }

    return isLte ? lte(value, condition.value) : lt(value, condition.value);
};

const notValidator = (condition: Filter, value: string) => {
    if (typeof value === "number") {
        return Number(value) !== Number(condition.value);
    }

    return value !== condition.value;
};

const emptyValidator = (condition: Filter, value: string) => {
    return Boolean(condition.value) === true ? isEmpty(value) : true;
};

const containsValidator = (condition: Filter, value: string, contains = true) => {
    if (contains === false) {
        return value?.includes(condition.value) ? false : true;
    }

    return value?.includes(condition.value);
};

// For now we have filters only for those fields that we support
// Except for filter condition "between, not_between", "in, not_in"
// because it's unclear what components should we use for those conditions
// and what those filter conditions should acctualy do
// "in & not_in" condition accept an array of strings or numbers
// "between & not_between" also accept an array of numbers
// P.S This is an initial implementation just to see whether it works as expected
// It has to be refactored
const checkCondition = (condition: Filter, data: Record<string, any>) => {
    const fieldValue = get(data, condition.path, "");
    switch (condition.condition) {
        case "contains":
            return containsValidator(condition, fieldValue);
        case "not_contains":
            return containsValidator(condition, fieldValue, false);
        case "empty":
            return emptyValidator(condition, fieldValue);
        case "not":
            return notValidator(condition, fieldValue);
        case "gt":
            return gtValidator(condition, fieldValue);
        case "gte":
            return gtValidator(condition, fieldValue, true);
        case "lt":
            return ltValidator(condition, fieldValue);
        case "lte":
            return ltValidator(condition, fieldValue, true);
        default:
            return false;
    }
};

export function useBlockVariant(element: PbElement) {
    const context = useContext(DynamicSourceContext);

    if (!element?.data?.isVariantBlock) {
        return element;
    }

    let filteredVariant: PbElement | undefined;

    for (const variant of element.elements) {
        let matched = true;

        for (const condition of variant.data?.conditions) {
            if (!checkCondition(condition, context?.data)) {
                matched = false;
                break;
            }
        }

        if (matched) {
            filteredVariant = variant;
            break;
        }
    }

    return filteredVariant;
}
