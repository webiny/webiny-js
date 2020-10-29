import i18nContext from "./context";
import { ContextI18NGetLocales } from "@webiny/api-i18n/types";

let localesCache;

type ServicePluginsOptions = { localesFunction: string };

export default (options: ServicePluginsOptions) => {
    if (!options.localesFunction) {
        throw new Error(`I18N service plugins error - "localesFunction" not specified.`);
    }

    return [
        i18nContext,
        {
            name: "context-i18n-get-locales",
            type: "context-i18n-get-locales",
            async resolve({ context }) {
                if (Array.isArray(localesCache)) {
                    return localesCache;
                }

                localesCache = await context.handlerClient.invoke({
                    name: options.localesFunction
                });

                return localesCache;
            }
        } as ContextI18NGetLocales
    ];
};
