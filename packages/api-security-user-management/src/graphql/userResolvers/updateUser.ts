import { Batch } from "@commodo/fields-storage";
import { WithFieldsError } from "@webiny/commodo";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import {
    InvalidFieldsError,
    ErrorResponse,
    Response,
    NotFoundResponse
} from "@webiny/commodo-graphql";
import { SecurityUserManagementPlugin } from "../../types";
import {
    PK_USER,
    SK_USER
} from "@webiny/api-security-user-management/models/securityUserData.model";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { id, data } = args;

    const Model = context.models.SECURITY;

    const PK = `${PK_USER}#${id}`;

    // Get `U#` items from table
    const securityRecord = await Model.findOne({ query: { PK, SK: SK_USER } });

    if (!securityRecord) {
        return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
    }

    try {
        const user = securityRecord.data;
        const propsToUpdate = Object.keys(data);

        for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            // Update value
            user[key] = data[key];
        }
        // Add "savedOn"
        user.savedOn = new Date().toISOString();
        // Also update "GSI_DATA" along with "data"
        securityRecord.GSI_DATA = user;

        // Instead of creating new instances of "Security Model" we are reusing
        const securityRecordPrimary = new Model();
        await securityRecordPrimary.populate(securityRecord);

        securityRecordPrimary.PK = PK;
        securityRecordPrimary.SK = SK_USER;
        securityRecordPrimary.GSI1_SK = `login#${user.email}`;

        const securityRecordSecondary = new Model();
        await securityRecordSecondary.populate(securityRecord);

        securityRecordSecondary.PK = PK;
        securityRecordSecondary.SK = "createdOn";
        securityRecordSecondary.GSI1_SK = `createdOn#${user.createdOn}`;

        const batch = new Batch(
            // User item - A
            [securityRecordPrimary, "save"],
            // User item - createdOn
            [securityRecordSecondary, "save"]
        );

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        if (authPlugin) {
            await authPlugin.updateUser({ data: args.data, user }, context);
        }

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
