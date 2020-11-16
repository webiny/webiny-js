import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { FormsCRUD } from "../../../types";

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const forms: FormsCRUD = context?.formBuilder?.crud?.forms;

    const { id, data, reCaptchaResponseToken, meta } = args;

    const form = await forms.getForm(id);

    if (!form || !form.published) {
        return new NotFoundResponse(`Form with id "${args.id}" was not found!`);
    }

    try {
        const formSubmission = await forms.submit({ data, reCaptchaResponseToken, meta, form });
        return new Response(formSubmission);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
