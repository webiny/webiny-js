import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { FormsCRUD } from "../../../types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const forms: FormsCRUD = context?.formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.getForm(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }
        // Before delete
        if (existingForm.version > 1 && existingForm.latestVersion) {
            await forms.markPreviousLatestVersion({
                parentId: existingForm.parent,
                version: existingForm.version,
                latestVersion: true
            });
        }

        await forms.deleteForm(id);

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
