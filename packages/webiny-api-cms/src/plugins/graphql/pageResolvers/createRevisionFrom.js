// @flow
import type { Entity } from "webiny-entity";
import type { IPage } from "../../../entities/Page.entity";
import { ErrorResponse, NotFoundResponse, Response } from "webiny-api/graphql";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const pageClass = entityFetcher(context);

    const sourceRev: IPage = (await pageClass.findById(args.revision): any);
    if (!sourceRev) {
        return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
    }

    const newRevision: IPage = (new pageClass(): any);
    try {
        newRevision.populate({
            url: sourceRev.url,
            title: sourceRev.title,
            snippet: sourceRev.snippet,
            settings: sourceRev.settings,
            content: sourceRev.content,
            category: await sourceRev.category,
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
