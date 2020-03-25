import { CmsModelFieldValue } from "@webiny/api-headless-cms/types";

export const getI18NValue = (valueObject?: string | CmsModelFieldValue<string>): string => {
    if (!valueObject) {
        return "";
    }

    if (typeof valueObject === "string") {
        return valueObject;
    }

    if (Array.isArray(valueObject.values)) {
        const [defaultLocaleValue] = valueObject.values;
        if (defaultLocaleValue && defaultLocaleValue.value) {
            return defaultLocaleValue.value;
        }
    }

    return "";
};
