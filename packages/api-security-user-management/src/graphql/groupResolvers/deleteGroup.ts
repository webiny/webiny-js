import { Batch } from "@commodo/fields-storage";
import { NotFoundResponse, Response, ErrorResponse } from "@webiny/graphql";

export default async (_, { id }, context) => {
    const Model = context.models.Security;

    const PK = `G#${id}`;

    try {
        // Remove `G#` items from table
        const groupRecord = await Model.findOne({ query: { PK, SK: "A" } });

        if (groupRecord) {
            const fields = ["A", "slug"];

            const batch = new Batch(
                ...fields.map(field => {
                    return [Model, "delete", { query: { PK, SK: field } }];
                })
            );

            await batch.execute();
            return new Response(true);
        }
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data || null
        });
    }

    return new NotFoundResponse(`Group: ${id}`);
};
