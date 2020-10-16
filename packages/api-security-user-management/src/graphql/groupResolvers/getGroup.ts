import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import {
    GSI1_PK_GROUP,
    PK_GROUP,
    SK_GROUP
} from "@webiny/api-security-user-management/models/securityGroupData.model";

export default async (_, { id, slug }, context) => {
    const Model = context.models.Security;

    try {
        if (id) {
            const PK = `${PK_GROUP}#${id}`;
            // Load "Group" by "id"
            const group = await Model.findOne({
                query: {
                    PK: PK,
                    SK: SK_GROUP
                }
            });

            if (!group) {
                return new NotFoundResponse(`Unable to find group with id: ${id}`);
            }
            return new Response(group.data);
        }

        if (slug) {
            const GSI_PK = GSI1_PK_GROUP;
            const GSI_SK = `slug#${slug}`;
            // Load "Group" by "slug"
            const group = await Model.findOne({
                query: {
                    GSI1_PK: GSI_PK,
                    GSI1_SK: GSI_SK
                }
            });

            if (!group) {
                return new NotFoundResponse(`Unable to find group with slug: ${slug}`);
            }
            return new Response(group.GSI_DATA);
        }
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data || null
        });
    }
};
