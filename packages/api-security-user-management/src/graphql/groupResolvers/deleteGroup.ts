import { NotFoundResponse, Response, ErrorResponse } from "@webiny/graphql/responses";

export default async (_, { id }, context) => {
    const { groups } = context;
    try {
        const group = await groups.get(id);

        if (!group) {
            return new NotFoundResponse(`Group with id: ${id} not found!`);
        }

        await groups.delete(id);

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data || null
        });
    }
};
