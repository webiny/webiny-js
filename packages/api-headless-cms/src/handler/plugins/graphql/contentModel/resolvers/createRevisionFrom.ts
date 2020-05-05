import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";

export default async (root: any, args: { [key: string]: any }, context: { [key: string]: any }) => {
    const { CmsContentModel } = context.models;

    const sourceRev = await CmsContentModel.findById(args.revision);
    if (!sourceRev) {
        return new NotFoundResponse(`Revision with id "${args.revision}" was not found!`);
    }

    const newRevision = new CmsContentModel();

    try {
        newRevision.populate({
            title: sourceRev.title,
            group: await sourceRev.group,
            modelId: sourceRev.modelId,
            settings: sourceRev.settings,
            layout: sourceRev.layout,
            fields: sourceRev.fields,
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
