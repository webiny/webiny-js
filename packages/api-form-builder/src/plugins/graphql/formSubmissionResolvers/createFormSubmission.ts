import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const forms = context?.formBuilder?.crud?.forms;
    const form = await forms.get(args.id);

    if (!form || !form.published) {
        return new NotFoundResponse(`Form with id "${args.id}" was not found!`);
    }

    try {
        const formSubmission = await forms.submit({ ...args, form });
        return new Response(formSubmission);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
