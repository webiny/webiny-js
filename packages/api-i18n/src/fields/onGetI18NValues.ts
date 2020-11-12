import { HandlerI18NContextObject } from "@webiny/api-i18n/types";

export default (value: Record<string, any>[], i18n: HandlerI18NContextObject) => {
    // Let's make current locale's value the first element of the array.
    if (value.length < 2) {
        return value;
    }

    const currentLocale = i18n.getCurrentLocale();
    const currentLocaleItemIndex = value.findIndex(item => item.locale === currentLocale.id);

    const output = [...value];
    const [currentLocaleItem] = output.splice(currentLocaleItemIndex, 1);

    output.unshift(currentLocaleItem);

    return output;
};
