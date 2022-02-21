import hasPermission from "./utils/hasI18NContentPermission";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { I18NContentContext } from "./types";
import { GraphQLResolveInfo } from "graphql";

// TODO @ts-refactor figure out if this is used anywhere?
export const hasI18NContentPermission = () => {
    return (resolver: GraphQLFieldResolver) => {
        return async (
            parent: any,
            args: Record<string, string>,
            context: I18NContentContext,
            info: GraphQLResolveInfo
        ) => {
            const permission = await hasPermission(context);
            if (!permission) {
                return new NotAuthorizedResponse();
            }

            return resolver(parent, args, context, info);
        };
    };
};
