export default (value: {[key: string]: any}[], i18n: {[key: string]: any}[]) => {
    // Let's make current locale's value the first element of the array.
    if (value.length < 2) {
        return value;
    }

    // TODO: fix types (create a type for "i18n" parameter)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const currentLocale = i18n.getLocale();
    const currentLocaleItemIndex = value.findIndex(item => item.locale === currentLocale.id);

    const output = [...value];
    const [currentLocaleItem] = output.splice(currentLocaleItemIndex, 1);

    output.unshift(currentLocaleItem);

    return output;
};
