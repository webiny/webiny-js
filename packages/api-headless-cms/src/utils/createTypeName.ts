import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

export const createTypeName = (value: string): string => {
    return upperFirst(camelCase(value));
};
