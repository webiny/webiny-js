// @flow
import type { Entity } from "webiny-entity";
import type { IForm } from "webiny-api-forms/entities";
import { ErrorResponse, NotFoundResponse, Response } from "webiny-api/graphql";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const Form = entityFetcher(context);

    const sourceRev: IForm = (await Form.findById(args.revision): any);
    if (!sourceRev) {
        return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
    }

    const newRevision: IForm = (new Form(): any);
    try {
        newRevision.populate({
            name: sourceRev.name,
            settings: sourceRev.settings,
            content: sourceRev.content,
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
