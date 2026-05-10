import type { CmsModel } from "~/types/index.js";
import crypto from "crypto";

interface GenerateCacheKeyParams {
    models: Pick<CmsModel, "modelId" | "singularApiName" | "pluralApiName" | "savedOn">[];
}

const getSavedOn = (input: Date | string | undefined | null): string => {
    if (!input) {
        return "unknown";
    } else if (input instanceof Date) {
        return input.toISOString();
    }
    try {
        const savedOn = new Date(input);
        return savedOn.toISOString();
    } catch {
        return "unknown";
    }
};
/**
 * Method generates cache key based on last model change time.
 * Or sets "unknown" - possible when no models in database.
 */
export const generateCacheKey = async (params: GenerateCacheKeyParams): Promise<string> => {
    const { models } = params;

    const keys: string[] = [];
    for (const model of models) {
        const value = getSavedOn(model.savedOn);

        keys.push(model.modelId, model.singularApiName, model.pluralApiName, value);
    }
    const key = keys.join("#");

    const hash = crypto.createHash("sha512");
    hash.update(key);
    return hash.digest("hex");
};
