import models from "../models";
import {
    PK_USER,
    SK_USER
} from "@webiny/api-security-user-management/models/securityUserData.model";
import { GSI1_PK_GROUP } from "@webiny/api-security-user-management/models/securityGroupData.model";

export default () => [
    models(),
    {
        type: "permissions-manager-middleware",
        async getPermissions({ identity }, context) {
            const Model = context.models.SECURITY;
            if (identity) {
                const securityRecord = await Model.findOne({
                    query: { PK: `${PK_USER}#${identity}`, SK: SK_USER }
                });
                const user = securityRecord.data;
                if (!user) {
                    throw Error(`User "${identity}" was not found!`);
                }

                return user.permissions;
            }

            // Identity is "anonymous", and we need to load permissions from the "anonymous" group.

            const securityRecord = await Model.findOne({
                query: { GSI1_PK: GSI1_PK_GROUP, GSI1_SK: `slug#anonymous` }
            });
            const group = securityRecord.data;
            if (!group) {
                return [];
            }

            return group.permissions;
        }
    }
];
