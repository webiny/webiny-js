import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";

export default async (_, { id, slug }, context) => {
    const { groups } = context;
    try {
        if (id) {
            const group = await groups.get(id);

            if (!group) {
                return new NotFoundResponse(`Unable to find group with id: ${id}`);
            }
            return new Response(group.data);
        }

        if (slug) {
            const group = await groups.getBySlug(slug);

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
