import { Response, ErrorResponse } from "@webiny/graphql";

export default async (_, { data }, context) => {
    const { groups } = context;

    try {
        const groupData = await groups.create(data);

        return new Response(groupData);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
