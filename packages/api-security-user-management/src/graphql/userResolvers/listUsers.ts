import { ListResponse, ListErrorResponse } from "@webiny/graphql";
import { GSI1_PK_USER } from "@webiny/api-security-user-management/models/security.model";

export default async (_, args, context) => {
    const Model = context.models.Security;

    // Load "users" from GSI1
    try {
        const securityRecords = await Model.find({
            query: {
                GSI1_PK: GSI1_PK_USER,
                GSI1_SK: { $beginsWith: "createdOn#" }
            }
        });

        const results = [];
        for (let i = 0; i < securityRecords.length; i++) {
            const { GSI_DATA: user } = securityRecords[i];

            results.push(user);
        }

        return new ListResponse(results);
    } catch (e) {
        return new ListErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
