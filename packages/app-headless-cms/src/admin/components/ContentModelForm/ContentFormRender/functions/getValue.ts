import get from "lodash/get";

const getValue = ({ bind, locale, field, index }) => {
    let values = get(bind, "value.values");
    if (!Array.isArray(values)) {
        values = [];
    }

    let valueForLocale = values.find(item => item.locale === locale);
    if (valueForLocale) {
        valueForLocale = valueForLocale.value;
    }

    if (field.multipleValues) {
        if (!Array.isArray(valueForLocale)) {
            valueForLocale = [];
        }

        if (index >= 0) {
            return valueForLocale[index] || null;
        }

        return valueForLocale;
    }

    return valueForLocale || null;
};

export default getValue;
