import { GraphQLContext as APIContext } from "@webiny/api/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFindQuery } from "./createFindQuery";

type FindEntry = {
    model: CmsModel;
    args: {
        locale: string;
        where: { [key: string]: any };
    };
    context: APIContext;
};

export const findEntry = async ({ model, args, context }: FindEntry) => {
    const Model = context.models[model.modelId];

    const query = createFindQuery(model, args.where, context);

    return Model.findOne({ query });
};
