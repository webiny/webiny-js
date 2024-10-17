import type { Context } from "~/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export const listModels = async (context: Context): Promise<CmsModel[]> => {
    return await context.security.withoutAuthorization(async () => {
        try {
            const models = await context.cms.listModels();

            return models.filter(model => {
                return !model.isPrivate;
            });
        } catch (ex) {
            return [];
        }
    });
};
