import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse } from "@webiny/handler-graphql";
import minimatch from "minimatch";

export const hasPermission = (permission: any, checkPermission: Function) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context, info) => {
            const perms = await context.security.getPermissions();
            const matchedPermission = perms.find(p => minimatch(permission, p.name));

            if (matchedPermission) {
                const allowed = await checkPermission({
                    args,
                    permission: matchedPermission,
                    context
                });

                if (!allowed) {
                    return new ErrorResponse({
                        message: "Not authorized! Missing permission required for the operation!",
                        code: "SECURITY_NOT_AUTHORIZED",
                        data: { allowed, permission: matchedPermission }
                    });
                }

                return resolver(parent, args, context, info);
            }

            return new ErrorResponse({
                message: "Not authorized!",
                code: "SECURITY_NOT_AUTHORIZED"
            });
        };
    };
};
