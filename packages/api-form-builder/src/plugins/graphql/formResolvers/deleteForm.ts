import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const forms = context?.formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.get(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }
        // TODO: Delete all submission and revisions
        await forms.delete(id);
        // Delete form with "id" from "Elastic Search"
        // Note: We might need to create all the revisions of this form from too.
        await context.elasticSearch.delete({
            id,
            index: "form-builder",
            type: "_doc"
        });
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
