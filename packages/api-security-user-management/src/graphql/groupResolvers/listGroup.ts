import { ListResponse, ListErrorResponse } from "@webiny/graphql";

export default async (_, { where, sort = 1 }, context) => {
    const Model = context.models.Security;

    let beginsWith = "name#";
    if (where?.nameBeginsWith) {
        beginsWith = `name#${where.nameBeginsWith}`;
    }

    try {
        // Load "Groups"
        const groups = await Model.find({
            query: {
                GSI1_PK: `Group`,
                GSI1_SK: { $beginsWith: beginsWith }
            },
            sort: { GSI1_SK: sort }
        });

        const data = groups.map(group => group.GSI_DATA);

        return new ListResponse(data);
    } catch (e) {
        return new ListErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data || null
        });
    }
};
