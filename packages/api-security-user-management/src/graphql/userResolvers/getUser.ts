import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import {
    GSI1_PK_USER,
    PK_USER,
    SK_USER
} from "@webiny/api-security-user-management/models/security.model";

export default async (_, args, context) => {
    const { id, login } = args;
    const Model = context.models.Security;

    try {
        let record;

        if (id) {
            const PK = `${PK_USER}#${id}`;
            record = await Model.findOne({
                query: {
                    PK: PK,
                    SK: SK_USER
                }
            });

            if (!record) {
                return new NotFoundResponse("User not found!");
            }
        }

        if (login) {
            const GSI_PK = GSI1_PK_USER;
            const GSI_SK = `login#${login}`;
            // Load "User" by "login"
            record = await Model.findOne({
                query: {
                    GSI1_PK: GSI_PK,
                    GSI1_SK: GSI_SK
                }
            });

            if (!record) {
                return new NotFoundResponse("User not found!");
            }
        }

        const user = record.GSI_DATA;
        const { GSI_DATA: data } = await record.toStorage();

        // Use "SecurityUser" props
        const groupData = await user.groupData;
        const permissions = await user.permissions;
        const personalAccessTokensData = await user.personalAccessTokensData;

        return new Response({
            ...data,
            fullName: user.fullName,
            group: groupData,
            permissions,
            personalAccessTokens: personalAccessTokensData
        });
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
