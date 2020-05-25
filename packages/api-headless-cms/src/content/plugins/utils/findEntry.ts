import { CmsContext, CmsContentModel } from "@webiny/api-headless-cms/types";
import { createFindParameters } from "./createFindParameters";
import { parseWhere } from "./parseWhere";

type FindEntry = {
    model: CmsContentModel;
    args: {
        locale: string;
        where: { [key: string]: any };
    };
    context: CmsContext;
};

export const findEntry = async ({ model, args, context }: FindEntry) => {
    const Model = context.models[model.modelId];
    const { CmsContentEntrySearch } = context.models;

    const { query } = createFindParameters({ model, where: parseWhere(args.where), context });

    if (context.cms.READ) {
        query.published = true;
    } else {
        query.latestVersion = true;
    }

    if (!context.cms.MANAGE) {
        query.locale = context.cms.locale.id;
    }

    const index: any = await CmsContentEntrySearch.findOne({
        query: {
            ...query,
            model: model.modelId
        },
        fields: ["revision"]
    });

    if (!index) {
        return null;
    }

    return await Model.findById(index.revision);
};
