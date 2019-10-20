import { ErrorResponse, Response } from "@webiny/api";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import { omit } from "lodash";
import * as data from "./data";

const ensureFullAccessRole = async context => {
    const { SecurityRole } = context.models;
    let role = await SecurityRole.findOne({ query: { slug: "full-access" } });
    if (!role) {
        role = new SecurityRole();
        await role.populate(data.fullAccessRole).save();
    }
    return role;
};

const ensureFullAccessGroup = async context => {
    const { SecurityGroup } = context.models;
    let group = await SecurityGroup.findOne({ query: { slug: "security-full-access" } });
    if (!group) {
        group = new SecurityGroup();
        await group.populate({ ...data.securityFullAccessGroup, roles: data.roles }).save();
    }
};

export const install = async (root: any, args: Object, context: Object) => {
    const { SecurityUser } = context.models;
    const { data } = args;

    if (await isSecurityInstalled(context)) {
        return new ErrorResponse({
            code: "SECURITY_INSTALL_ABORTED",
            message: "Security is already installed."
        });
    }

    /**
     * At this point we know there is a user missing either in Webiny DB, or in the 3rd party auth provider, or both.
     */
    const result = { user: false, authUser: false };

    try {
        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("createUser"))
            .pop();

        const fullAccessRole = await ensureFullAccessRole(context);
        await ensureFullAccessGroup(context);

        // Try loading the user
        let user = await SecurityUser.findOne({ query: { email: args.data.email } });
        if (!user) {
            // Create new user
            user = new SecurityUser();
            await user.populate({ ...data, roles: [fullAccessRole] }).save();
            result.user = true;
        } else {
            // Update user's data
            user.firstName = data.firstName;
            user.lastName = data.lastName;
            await user.save();
        }

        try {
            await authPlugin.createUser({ data: args.data, user, permanent: true }, context);
            result.authUser = true;
        } catch {
            // Update firstName/lastName, but do not touch the existing password
            await authPlugin.updateUser({ data: omit(args.data, ["password"]), user }, context);
        }
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

    return new Response(result);
};

export const isInstalled = async (root: any, args: Object, context: Object) => {
    return new Response(await isSecurityInstalled(context));
};

/**
 * We consider security to be installed if there are users in both Webiny DB
 * and 3rd party authentication provider.
 */
const isSecurityInstalled = async context => {
    const { SecurityUser } = context.models;

    // Check if at least 1 user exists in the system
    const userCount = await SecurityUser.count();

    if (userCount > 0) {
        // Make sure the authentication provider also has at least 1 user
        const authPlugin = context.plugins
            .byType("security-authentication-provider")
            .filter(pl => pl.hasOwnProperty("countUsers"))
            .pop();

        const remoteUserCount = await authPlugin.countUsers();
        if (remoteUserCount > 0) {
            return true;
        }
    }

    return false;
};
