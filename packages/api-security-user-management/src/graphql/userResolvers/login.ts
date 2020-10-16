import { Batch } from "@commodo/fields-storage";
import { Response, ErrorResponse } from "@webiny/commodo-graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import {
    GSI1_PK_USER,
    PK_USER,
    SK_USER
} from "@webiny/api-security-user-management/models/securityUserData.model";
import { SecurityUserManagementPlugin } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const identity = context.security.getIdentity();

        if (!identity) {
            throw new Error("Not authorized!");
        }

        const Model: any = context.models.Security;
        const { SecurityUser } = context.models;

        const securityRecord = await Model.findOne({
            query: { PK: `${PK_USER}#${identity.id}`, SK: SK_USER }
        });

        let firstLogin = false;
        let user = securityRecord?.data;

        if (!securityRecord) {
            firstLogin = true;
            // Create a "Security User"
            user = new SecurityUser();
            await user.populate({
                id: identity.id,
                email: identity.login,
                firstName: identity.firstName || "",
                lastName: identity.lastName || ""
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

            await batch.execute();
        }

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        if (typeof authPlugin.onLogin === "function") {
            await authPlugin.onLogin({ user, firstLogin }, context);
        }

        return new Response(user);
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data
        });
    }
};

export default resolver;
