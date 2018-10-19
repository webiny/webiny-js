// @flow
import type { Entity } from "webiny-entity";
import type { IRevision } from "../../../entities/Revision.entity";
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
    const revisionClass = entityFetcher(context);

    const sourceRev: IRevision = (await revisionClass.findById(args.revisionId): any);
    if (!sourceRev) {
        return notFound(args.revisionId);
    }

    const page = await sourceRev.page;

    const newRevision: IRevision = (new revisionClass(): any);
    try {
        newRevision.populate({
            name: args.name,
            slug: sourceRev.slug,
            title: sourceRev.title,
            settings: sourceRev.settings,
            content: sourceRev.content,
            page
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
