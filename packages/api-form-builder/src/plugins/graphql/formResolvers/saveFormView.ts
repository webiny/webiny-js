import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { FormsCRUD } from "../../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const forms: FormsCRUD = context?.formBuilder?.crud?.forms;
        const form = await forms.getForm(args.id);

        if (!form) {
            return new NotFoundResponse(`Form with id "${args.id}" was not found!`);
        }

        // Increment views
        form.stats.views = form.stats.views + 1;

        await forms.saveFormStats(args.id, form.stats);

        return new Response(null);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
