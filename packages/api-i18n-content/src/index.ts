import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";

export const hasContentLocalePermission = () => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context, info) => {
            const contentLocale = context.i18n.getCurrentLocale("content");
            const contentPermission = await context.security.getPermission("content.i18n");
            if (!contentPermission) {
                return new NotAuthorizedResponse();
            }

            const hasLocaleAccess =
                !Array.isArray(contentPermission.locales) ||
                contentPermission.locales.includes(contentLocale.code);
            if (!hasLocaleAccess) {
                return new NotAuthorizedResponse();
            }

            return resolver(parent, args, context, info);
        };
    };
};
