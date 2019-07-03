// @flow
import type { IForm } from "webiny-api-forms/entities";
import { ErrorResponse, NotFoundResponse, Response } from "webiny-api/graphql";

export default async (root: any, args: Object, context: Object) => {
    const { Form } = context.getEntities();

    const sourceRev: IForm = (await Form.findById(args.revision): any);
    if (!sourceRev) {
        return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
    }

    const newRevision: IForm = (new Form(): any);
    try {
        newRevision.populate({
            name: sourceRev.name,
            settings: sourceRev.settings,
            layout: sourceRev.layout,
            fields: sourceRev.fields,
            triggers: sourceRev.triggers,
            parent: sourceRev.parent
        });
        await newRevision.save();
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
    return new Response(newRevision);
};
