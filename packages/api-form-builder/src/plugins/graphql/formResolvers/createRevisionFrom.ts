import { ErrorResponse, Response, NotFoundResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { FormsCRUD } from "../../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const { formBuilder } = context;
        const forms: FormsCRUD = formBuilder?.crud?.forms;

        const sourceRev = await forms.getForm(args.revision);
        if (!sourceRev) {
            return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
        }

        const form = await forms.createFormRevision(sourceRev);

        return new Response(form);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
