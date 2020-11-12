import { ErrorResponse, Response } from "@webiny/graphql";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import * as data from "./data";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";

const ensureFullAccessGroup = async context => {
    const { groups } = context;

    let groupData = await groups.getBySlug("security-full-access");

    if (!groupData) {
        groupData = await groups.create(data.securityFullAccessGroup);
    }
    return groupData;
};

/**
 * We consider security to be installed if there are users in Webiny DB.
 */
const isSecurityInstalled = async context => {
    const { users } = context;

    // Check if at least 1 user exists in the system
    const userList = await users.list();
    return !!userList?.length;
};

export const install: GraphQLFieldResolver = async (root, args, context) => {
    const { users } = context;
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
        const fullAccessGroup = await ensureFullAccessGroup(context);

        // Create new user
        await authPlugin.createUser({ data, user: data, permanent: true }, context);

        await users.create({ ...data, group: fullAccessGroup.id });

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
