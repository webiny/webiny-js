/**
 * This resolver is used in `headlessRead` to load field value based on the requested `locale`.
 *
 * @param entry
 * @param args
 * @param context
 * @param options
 * @returns {*}
 */
export default (entry, args, context, { fieldName }) => {
    const value = entry[fieldName];

    if (!value) {
        return null;
    }

    const i18n = value.reduce((acc, v) => {
        acc[v.locale] = v.value;
        return acc;
    }, {});

    const locale = args.locale || entry._locale || context.locale || context.defaultLocale;

    return i18n[locale];
};
