/**
 * Package i18n-locales does not have types.
 */
// @ts-ignore
import localesList from "i18n-locales";
// @ts-refactor
export default async (_: { [key: string]: any }, args: { [key: string]: any }) => {
    const search = typeof args.search === "string" ? args.search.toLowerCase() : "";
    return { data: localesList.filter((item: string) => item.toLowerCase().includes(search)) };
};
