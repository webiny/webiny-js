import minimatch from "minimatch";
import { Context } from "@webiny/handler/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import NotAuthorizedResponse from "./NotAuthorizedResponse";

// TODO: refactor the remaining usages of this function and eliminate it completely

export const hasPermission = <TSource = any, TArgs = any, TContext = Context>(
    permission: any
): Function => {
    return (resolver: GraphQLFieldResolver<TSource, TArgs, TContext>) => {
        return async (parent, args, context, info) => {
            const perms = await context.security.getPermissions();

            if (perms.find(p => minimatch(permission, p.name))) {
                return resolver(parent, args, context, info);
            }

            return new NotAuthorizedResponse();
        };
    };
};
