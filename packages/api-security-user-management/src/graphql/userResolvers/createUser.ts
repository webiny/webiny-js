import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { WithFieldsError } from "@webiny/commodo";
import { InvalidFieldsError, ErrorResponse, Response } from "@webiny/commodo-graphql";
import { Batch } from "@commodo/fields-storage";
import { SecurityUserManagementPlugin } from "../../types";
import {
    GSI1_PK_USER,
    SK_USER,
    PK_USER
} from "@webiny/api-security-user-management/models/security.model";

const resolver: GraphQLFieldResolver = async (root, { data }, context) => {
    const Model = context.models.Security;
    const { SecurityUser } = context.models;

    try {
        const identity = context.security.getIdentity();

        const user = new SecurityUser();
        await user.populate({
            createdBy: identity,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            groups: data.groups,
            avatar: data.avatar,
            personalAccessTokens: data.personalAccessTokens
        });

        const PK = `${PK_USER}#${user.id}`;

        const securityRecordPrimary = new Model();
        securityRecordPrimary.PK = PK;
        securityRecordPrimary.SK = SK_USER;
        securityRecordPrimary.GSI1_PK = GSI1_PK_USER;
        securityRecordPrimary.GSI1_SK = `login#${user.email}`;
        securityRecordPrimary.GSI_DATA = user;
        securityRecordPrimary.data = user;

        const securityRecordSecondary = new Model();
        securityRecordSecondary.PK = PK;
        securityRecordSecondary.SK = "createdOn";
        securityRecordSecondary.GSI1_PK = GSI1_PK_USER;
        securityRecordSecondary.GSI1_SK = `createdOn#${user.createdOn}`;
        securityRecordSecondary.GSI_DATA = user;
        securityRecordSecondary.data = user;

        // Here we can't use the "SecurityUser" because "Batch" operation works with "Model" and not "instance"
        const batch = new Batch(
            // User item - A
            [securityRecordPrimary, "save"],
            // User item - createdOn
            [securityRecordSecondary, "save"]
        );

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        await authPlugin.createUser({ data: data, user }, context);

        await batch.execute();

        return new Response(securityRecordPrimary.data);
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

export default resolver;
