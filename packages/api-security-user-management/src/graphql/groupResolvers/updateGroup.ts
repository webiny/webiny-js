import { NotFoundResponse, Response, ErrorResponse } from "@webiny/graphql";

export default async (_, { id, data }, context) => {
    const { groups } = context;

    try {
        const existingGroup = await groups.get(id);

        if (!existingGroup) {
            return new NotFoundResponse(`Group with id: ${id} not found!`);
        }

        const updatedGroupData = await groups.update({
            id,
            data,
            existingGroupData: existingGroup.data
        });

        return new Response(updatedGroupData);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
