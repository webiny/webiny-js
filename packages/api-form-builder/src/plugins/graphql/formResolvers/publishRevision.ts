import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { FormsCRUD } from "../../../types";

export const publishRevision: GraphQLFieldResolver = async (root, args, context) => {
    const forms: FormsCRUD = context?.formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.getForm(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }

        await forms.publishForm(existingForm.id);
        const form = await forms.getForm(id);

        return new Response(form);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export const unPublishRevision: GraphQLFieldResolver = async (root, args, context) => {
    const forms: FormsCRUD = context?.formBuilder?.crud?.forms;
    const { id } = args;

    try {
        const existingForm = await forms.getForm(id);

        if (!existingForm) {
            return new NotFoundResponse(`Form with id:"${id}" not found!`);
        }

        await forms.unPublishForm(existingForm.id);
        const form = await forms.getForm(id);

        return new Response(form);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
