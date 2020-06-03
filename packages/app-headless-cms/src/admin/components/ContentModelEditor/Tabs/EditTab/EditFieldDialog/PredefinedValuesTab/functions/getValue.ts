import get from "lodash/get";

const getValue = ({ bind, locale, index, name }) => {
    let values = get(bind, "value.values");
    if (!Array.isArray(values)) {
        values = [];
    }

    let valueForLocale = values.find(item => item.locale === locale);
    if (valueForLocale) {
        valueForLocale = valueForLocale.value;
    }

    if (index >= 0) {
        if (!Array.isArray(valueForLocale)) {
            valueForLocale = [];
        }

        return get(valueForLocale, `${index}.${name}`);
    }

    return valueForLocale || [];
};

export default getValue;
