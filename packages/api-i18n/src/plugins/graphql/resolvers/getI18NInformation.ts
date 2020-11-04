import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";

const resolver: GraphQLFieldResolver<any, any, HandlerI18NContext> = (_, args, context) => {
    const { i18n } = context;
    return {
        currentLocales: i18n.getCurrentLocales(),
        defaultLocale: i18n.getDefaultLocale(),
        locales: i18n.getLocales()
    };
};

export default resolver;
