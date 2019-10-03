// @flow
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/api";

export default async (root: any, args: Object, context: Object) => {
    const { PbPage } = context.models;
    const sourceRev = (await PbPage.findById(args.revision): any);
    if (!sourceRev) {
        return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
    }

    const newRevision = (new PbPage(): any);
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
