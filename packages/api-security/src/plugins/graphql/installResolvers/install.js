import { ErrorResponse, Response } from "@webiny/api";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import * as data from "./data";

export const install = async (root: any, args: Object, context: Object) => {
    const { SecurityUser, SecurityRole, SecurityGroup } = context.models;

    // We only create a new user if there are no existing users in the system.
    const userCount = await SecurityUser.count();
    if (userCount > 0) {
        return new ErrorResponse({
            code: "SECURITY_INSTALL_ABORTED",
            message: "Users already exist!"
        });
    }

    const user = new SecurityUser();

    try {
        const fullAccess = new SecurityRole();
        await fullAccess.populate(data.fullAccessRole).save();

        const group = new SecurityGroup();
        await group.populate({ ...data.securityFullAccessGroup, roles: data.roles }).save();

        await user.populate({ ...args.data, roles: [fullAccess] }).save();

        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("createUser"))
            .pop();

        await authPlugin.createUser({ data: args.data, user, permanent: true }, context);
    } catch (e) {
        if (e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS) {
            const attrError = InvalidFieldsError.from(e);
            return new ErrorResponse({
                code: attrError.code || WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS,
                message: attrError.message,
                data: attrError.data
            });
        }
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }

    return new Response(true);
};

export const isInstalled = async (root: any, args: Object, context: Object) => {
    const { SecurityUser } = context.models;

    // Check if at least 1 user exists in the system
    const userCount = await SecurityUser.count();

    return new Response(userCount > 0);
};
