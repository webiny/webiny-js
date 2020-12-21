import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { I18NContentContext } from "./types";
import { Context } from "@webiny/handler/types";

export const hasI18NContentPermission = () => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context: Context<I18NContentContext>, info) => {
            // If `content.i18n` permission is not present, immediately throw.
            const contentPermission = await context.security.getPermission("content.i18n");
            if (!contentPermission) {
                return new NotAuthorizedResponse();
            }

            // Otherwise, let's check if the identity has access to current content locale.
            // If `contentPermission.locales` array is present, that means identity's access is restricted
            // to the locales listed in it. If it's not present, that means there are no restrictions, or
            // in other words - identity can access all locales.
            const hasLocaleAccess =
                !Array.isArray(contentPermission.locales) ||
                contentPermission.locales.includes(context?.i18nContent?.locale?.code);
            if (!hasLocaleAccess) {
                return new NotAuthorizedResponse();
            }

            return resolver(parent, args, context, info);
        };
    };
};
