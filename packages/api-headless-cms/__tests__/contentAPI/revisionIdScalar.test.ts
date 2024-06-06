import { createContentModelGroup } from "~tests/contentAPI/mocks/contentModelGroup";
import models from "~tests/contentAPI/mocks/contentModels";
import { CmsGroup, CmsModel } from "~/types";
import { useArticleManageHandler } from "~tests/testHelpers/useArticleManageHandler";

describe("revision id scalar", () => {
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation, createContentModelMutation, createArticle } =
        useArticleManageHandler(manageHandlerOpts);

    let group: CmsGroup;

    beforeEach(async () => {
        const [result] = await createContentModelGroupMutation({
            data: createContentModelGroup()
        });
        group = result.data.createContentModelGroup.data;

        const articleModel = models.find(m => m.modelId === "article") as CmsModel;

        await createContentModelMutation({
            data: {
                name: articleModel.name,
                modelId: articleModel.modelId,
                singularApiName: articleModel.singularApiName,
                pluralApiName: articleModel.pluralApiName,
                fields: articleModel.fields,
                description: "This is a description.",
                icon: "fa/fas",
                group: group.id
            }
        });
    });

    it("should fail when sending malformed revision id into the ref field", async () => {
        const [result] = await createArticle({
            data: {
                category: {
                    modelId: "category",
                    id: "abdefghijklmnopqrstuvwxyz"
                }
            }
        });
        const message = `Variable "$data" got invalid value "abdefghijklmnopqrstuvwxyz" at "data.category.id"; Expected type "RevisionId". RevisionId value must be a valid Revision ID property! Example: "abcdef#0001"`;
        expect(result).toMatchObject({
            errors: [
                {
                    message
                }
            ]
        });
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toEqual(message);
    });
});
