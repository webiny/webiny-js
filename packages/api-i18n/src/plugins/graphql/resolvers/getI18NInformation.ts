import { GraphQLContext } from "../../../types";
import { GraphQLFieldResolver } from "@webiny/api/types";

const resolver: GraphQLFieldResolver<any, any, GraphQLContext> = (_, args, context) => {
    const { i18n } = context;
    return {
        currentLocale: i18n.getLocale(),
        defaultLocale: i18n.getDefaultLocale(),
        locales: i18n.getLocales()
    };
};

export default resolver;
