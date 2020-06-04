import { Context } from "../../../types";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver<any, any, Context> = (_, args, context) => {
    const { i18n } = context;
    return {
        currentLocale: i18n.getLocale(),
        defaultLocale: i18n.getDefaultLocale(),
        locales: i18n.getLocales()
    };
};

export default resolver;
