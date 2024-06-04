import { Context } from "~/types";

export const listModels = async (context: Context): Promise<string[]> => {
    return await context.security.withoutAuthorization(async () => {
        const models = await context.cms.listModels();

        return models.reduce<string[]>((collection, model) => {
            if (model.isPrivate) {
                return collection;
            }
            collection.push(model.modelId);
            return collection;
        }, []);
    });
};
