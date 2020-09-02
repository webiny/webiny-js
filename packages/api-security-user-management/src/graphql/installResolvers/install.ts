import { ErrorResponse, Response } from "@webiny/graphql";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import * as data from "./data";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

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
    const { SecurityGroup, SecurityRole } = context.models;
    let group = await SecurityGroup.findOne({ query: { slug: "security-full-access" } });
    if (!group) {
        // TODO: Remove this manual creation of "role" after commodo  update
        const roles = [];
        for (let i = 0; i < data.roles.length; i++) {
            const roleData = data.roles[i];
            const role = new SecurityRole();
            await role.populate(roleData).save();
            roles.push(role);
        }
        group = new SecurityGroup();
        await group.populate({ ...data.securityFullAccessGroup, roles: roles }).save();
    }
};

/**
 * We consider security to be installed if there are users in Webiny DB.
 */
const isSecurityInstalled = async context => {
    const { SecurityUser } = context.models;

    // Check if at least 1 user exists in the system
    return !!(await SecurityUser.findOne({ query: {} }));
};

export const install: GraphQLFieldResolver = async (root, args, context) => {
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
    try {
        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        const fullAccessRole = await ensureFullAccessRole(context);
        await ensureFullAccessGroup(context);

        // Create new user
        const user = new SecurityUser();
        await user.populate({ ...data, roles: [fullAccessRole] });

        await authPlugin.createUser({ data: args.data, user, permanent: true }, context);
        await user.save();
        return new Response(true);
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
};

export const isInstalled: GraphQLFieldResolver = async (root, args, context) => {
    return new Response(await isSecurityInstalled(context));
};
