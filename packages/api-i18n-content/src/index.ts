import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { I18NContentContext } from "./types";
import hasPermission from "./utils/hasI18NContentPermission";

export const hasI18NContentPermission = () => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context: I18NContentContext, info) => {
            if (await hasPermission(context)) {
                return resolver(parent, args, context, info);
            }
            return new NotAuthorizedResponse();
        };
    };
};
