/**
 * Set entry field value. The value set by this function will be stored to DB.
 * You can also set other values if required (meta data used by resolvers when fetching data, etc.).
 *
 * This function checks the incoming data and merges it with the existing data based on locales.
 *
 * @param value
 * @param entry
 * @param options
 */
export default (value, entry, { field }) => {
    const currentValue = entry[field.fieldId];
    if (Array.isArray(currentValue) && currentValue.length > 0) {
        const mergedValue = currentValue.map(model => ({
            value: model.value,
            locale: model.locale
        }));

        value.forEach(({ value, locale }) => {
            const index = mergedValue.findIndex(v => v.locale === locale);
            if (index === -1) {
                mergedValue.push({ value, locale });
            } else {
                mergedValue[index].value = value;
            }
        });

        entry[field.fieldId] = mergedValue;
        return;
    }

    entry[field.fieldId] = value;
};
