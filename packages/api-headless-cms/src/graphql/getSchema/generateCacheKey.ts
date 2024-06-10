import { CmsModel } from "~/types";
import crypto from "crypto";

interface GenerateCacheKeyParams {
    models: Pick<CmsModel, "modelId" | "singularApiName" | "pluralApiName" | "savedOn">[];
}

/**
 * Method generates cache key based on last model change time.
 * Or sets "unknown" - possible when no models in database.
 */
export const generateCacheKey = async (params: GenerateCacheKeyParams): Promise<string> => {
    const { models } = params;

    const keys: string[] = [];
    for (const model of models) {
        const savedOn = model.savedOn;
        const value =
            // @ts-expect-error
            savedOn instanceof Date || savedOn?.toISOString
                ? // @ts-expect-error
                  savedOn.toISOString()
                : savedOn || "unknown";
        keys.push(model.modelId, model.singularApiName, model.pluralApiName, value);
    }
    const key = keys.join("#");

    const hash = crypto.createHash("sha1");
    hash.update(key);
    return hash.digest("hex");
};
