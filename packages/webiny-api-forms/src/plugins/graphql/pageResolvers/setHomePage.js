// @flow
import { ErrorResponse, Response, NotFoundResponse } from "webiny-api/graphql";

export default async (root: any, args: Object, context: Object) => {
    const { FormsSettings, Form } = context.forms.entities;
    const { id } = args;

    const newHomeForm = await Form.findById(id);

    if (!newHomeForm) {
        return new NotFoundResponse(id);
    }

    const settings = await FormsSettings.load();
    if (settings.data.forms.home === newHomeForm.parent) {
        return new ErrorResponse({
            code: "ALREADY_HOMEFORM",
            message: `The form is already set as homeform.`
        });
    }

    if (!newHomeForm.published) {
        newHomeForm.published = true;
        await newHomeForm.save();
    }

    settings.data.forms.home = newHomeForm.parent;
    await settings.save();

    return new Response(newHomeForm);
};
