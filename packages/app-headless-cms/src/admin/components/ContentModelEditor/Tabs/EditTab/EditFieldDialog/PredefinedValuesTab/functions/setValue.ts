import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";

const setValue = ({ value, bind, locale, index, name }) => {
    const newValue = cloneDeep({ values: [], ...bind.value });

    let valueLocaleIndex = newValue.values.findIndex(item => item.locale === locale);

    if (index >= 0) {
        if (valueLocaleIndex >= 0) {
            if (!Array.isArray(newValue.values[valueLocaleIndex].value)) {
                newValue.values[valueLocaleIndex].value = [];
            }
        } else {
            newValue.values.push({ locale, value: [] });
            valueLocaleIndex = newValue.values.length - 1;
        }

        set(newValue, `values.${valueLocaleIndex}.value.${index}.${name}`, value);
    } else {
        if (valueLocaleIndex >= 0) {
            newValue.values[valueLocaleIndex].value = value;
        } else {
            newValue.values.push({ locale, value });
        }
    }

    // Filter out redundant empty values.
    newValue.values = newValue.values.filter(item => !!item.value);
    bind.onChange(newValue);
};

export default setValue;
