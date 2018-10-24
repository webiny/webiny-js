// @flow
import type { Entity } from "webiny-entity";
import type { IPage } from "../../../entities/Page.entity";
import { ErrorResponse, Response } from "webiny-api/graphql";

type EntityFetcher = (context: Object) => Class<Entity>;

const notFound = (id: string) =>
    new ErrorResponse({
        code: "NOT_FOUND",
        message: `Revision with id "${id}" was not found!`
    });

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const pageClass = entityFetcher(context);

    const sourceRev: IPage = (await pageClass.findById(args.revision): any);
    if (!sourceRev) {
        return notFound(args.revision);
    }

    const newRevision: IPage = (new pageClass(): any);
    try {
        newRevision.populate({
            slug: sourceRev.slug,
            title: sourceRev.title,
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
