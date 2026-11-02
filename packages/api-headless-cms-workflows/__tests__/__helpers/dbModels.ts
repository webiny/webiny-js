import type { CmsContext, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { expectOk } from "./entries.js";

/**
 * Creates a database model (not a code model) with one "title" field, in its own group (the model
 * holds the group slug, as the CMS does; the group id is generated, so it differs). Needs a
 * context with CMS write access to groups and models (the default `*`).
 */
export const createDbModel = async (
    context: CmsContext,
    modelId: string,
    tags: string[] = []
): Promise<CmsModel> => {
    const group = expectOk(
        await context.container.resolve(CreateGroupUseCase).execute({
            name: `${modelId} group`,
            slug: `${modelId}-group`,
            icon: { type: "icon", name: "fas/star" },
            description: ""
        })
    );
    const singular = modelId.charAt(0).toUpperCase() + modelId.slice(1);
    return expectOk(
        await context.container.resolve(CreateModelUseCase).execute({
            name: singular,
            modelId,
            singularApiName: singular,
            pluralApiName: `${singular}s`,
            group: group.slug,
            titleFieldId: "title",
            tags,
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    type: "text",
                    label: "Title"
                }
            ],
            layout: [["title"]]
        } as CreateModelUseCase.Input)
    );
};
