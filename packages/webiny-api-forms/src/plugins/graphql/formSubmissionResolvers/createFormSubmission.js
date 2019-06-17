// @flow
import type { IForm } from "webiny-api-forms/entities";
import { ErrorResponse, NotFoundResponse, Response } from "webiny-api/graphql";

export default async (root: any, args: Object, context: Object) => {
    const { CmsForm, FormSubmission } = context.getEntities();
    const form: ?IForm = await CmsForm.findById(args.id);

    if (!form) {
        return new NotFoundResponse(`Form with id "${args.id}" was not found!`);
    }

    try {
        const formSubmission = new FormSubmission();
        formSubmission.form = form;
        formSubmission.data = args.data;
        formSubmission.meta = args.meta;
        await formSubmission.save();
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
    return new Response();
};
