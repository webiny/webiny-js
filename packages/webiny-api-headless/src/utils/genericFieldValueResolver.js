/**
 * This resolver is used in `headlessRead` to load field value based on the requested `locale`.
 *
 * @param entity
 * @param args
 * @param context
 * @param options
 * @returns {*}
 */
export default (entity, args, context, { fieldName }) => {
    const i18n = (entity[fieldName] || []).reduce((acc, v) => {
        acc[v.locale] = v.value;
        return acc;
    }, {});

    if (args.locale) {
        // TODO: find locale ID and return data
    }

    return i18n[context.locale] || i18n[context.defaultLocale];
};
