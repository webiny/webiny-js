import { ErrorResponse, Response } from "@webiny/graphql";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError } from "@webiny/commodo-graphql";
import * as data from "./data";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "../../types";
import { createSecurityGroup } from "../groupResolvers/utils";
import { GSI1_PK_GROUP } from "@webiny/api-security-user-management/models/securityGroupData.model";
import { GSI1_PK_USER } from "@webiny/api-security-user-management/models/securityUserData.model";
import { createSecurityUser } from "../userResolvers/utils";

const ensureFullAccessGroup = async context => {
    const Model = context.models.SECURITY;
    const { SecurityGroup } = context.models;

    let securityRecord = await Model.findOne({
        query: { GSI1_PK: GSI1_PK_GROUP, GSI1_SK: `slug#security-full-access` }
    });

    if (!securityRecord) {
        const group = new SecurityGroup();
        group.populate({
            ...data.securityFullAccessGroup
        });

        securityRecord = await createSecurityGroup({ Model, group });
    }
    return securityRecord.GSI_DATA;
};

/**
 * We consider security to be installed if there are users in Webiny DB.
 */
const isSecurityInstalled = async context => {
    const Model = context.models.SECURITY;

    // Check if at least 1 user exists in the system
    return !!(await Model.findOne({
        query: { GSI1_PK: GSI1_PK_USER, GSI1_SK: { $beginsWith: "login#" } }
    }));
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
        const fullAccessGroup = await ensureFullAccessGroup(context);

        // Create new user
        const user = new SecurityUser();
        await user.populate({ ...data, group: fullAccessGroup.id });

        await authPlugin.createUser({ data: args.data, user, permanent: true }, context);

        await createSecurityUser({ Model: context.models.SECURITY, user });

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
