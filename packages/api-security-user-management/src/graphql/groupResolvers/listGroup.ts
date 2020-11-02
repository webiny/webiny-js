import { ListResponse, ListErrorResponse } from "@webiny/graphql";

export default async (_, { where, sort = 1 }, context) => {
    const { groups } = context;

    let beginsWith = "name#";
    if (where?.nameBeginsWith) {
        beginsWith = `name#${where.nameBeginsWith}`;
    }

    try {
        // Load "Groups"
        const groupList = await groups.list({ beginsWith, sort: { GSI1_SK: sort } });

        const data = groupList.map(group => group.GSI_DATA);

        return new ListResponse(data);
    } catch (e) {
        return new ListErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data || null
        });
    }
};
