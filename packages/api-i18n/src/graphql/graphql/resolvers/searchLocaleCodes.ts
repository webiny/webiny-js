/**
 * Package i18n-locales does not have types.
 */
// @ts-expect-error
import localesList from "i18n-locales";

interface SearchLocaleCodesArgs {
    search?: string;
}
// @ts-refactor
export default async (_: any, args: SearchLocaleCodesArgs) => {
    const search = typeof args.search === "string" ? args.search.toLowerCase() : "";
    return {
        data: localesList.filter((item: string) => item.toLowerCase().includes(search))
    };
};
