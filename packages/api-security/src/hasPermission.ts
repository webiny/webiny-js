import minimatch from "minimatch";
import { Context } from "@webiny/handler/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import NotAuthorizedResponse from "./NotAuthorizedResponse";

const checkPermission = <TSource, TArgs, TContext = Context>(permission: any) => {
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

export const hasScope = checkPermission;
export const hasPermission = checkPermission;
