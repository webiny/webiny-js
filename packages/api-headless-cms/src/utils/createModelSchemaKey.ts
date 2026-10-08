import { createHash } from "node:crypto";
import type { CmsModel } from "~/types/index.js";

/**
 * Schema key for a GraphQL schema factory that renders CMS models: what the rendered type definitions
 * depend on. That is the rendered models' API names and fields, plus the API names of every model,
 * which `ref` fields render. Tenant, timestamps and authorship are left out, so tenants with the same
 * models share one cached schema.
 */
export const createModelSchemaKey = (rendered: CmsModel[], models: CmsModel[]): string => {
    const renderedParts = rendered.map(model => {
        return {
            modelId: model.modelId,
            singularApiName: model.singularApiName,
            pluralApiName: model.pluralApiName,
            fields: model.fields
        };
    });
    const modelNames = models.map(model => {
        return `${model.modelId}:${model.singularApiName}:${model.pluralApiName}`;
    });

    const hash = createHash("sha1");
    hash.update(JSON.stringify(renderedParts));
    hash.update("\n");
    hash.update(modelNames.join("\n"));
    return hash.digest("hex");
};
