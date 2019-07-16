// @flow
import localesList from "i18n-locales";

export default async (_: Object, args: Object) => {
    const search = typeof args.search === "string" ? args.search.toLowerCase() : "";
    return { data: localesList.filter(item => item.toLowerCase().includes(search)) };
};
