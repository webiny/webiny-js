import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/lockedFields";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Used fields", () => {
    const { database, environment } = useContentHandler();

    const initial = {};
    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("must mark fields as used and prevent changes on it, as soon as the first entry is saved", async () => {
        const { content, createContentModel, getContentModel, updateContentModel } = environment(
            initial.environment.id
        );

        // 1. Create a content model with a single "title" field.
        let contentModel = await createContentModel(
            mocks.withTitleFieldOnly({ contentModelGroupId: initial.contentModelGroup.id })
        );

        expect(contentModel.lockedFields).toEqual([]);

        // 2. Create a new product entry.
        const products = await content("product");

        await products.create({
            data: mocks.createProduct
        });

        contentModel = await getContentModel({
            id: contentModel.id
        });

        expect(contentModel.lockedFields).toEqual([
            {
                fieldId: "someId",
                multipleValues: false,
                type: "text"
            },
            {
                fieldId: "title",
                multipleValues: false,
                type: "text"
            }
        ]);

        // 3. Let's try to remove the field. An error should be thrown because it's used.
        let error;
        try {
            await updateContentModel(
                mocks.tryToRemoveTitleField({ contentModelId: contentModel.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot remove the field "title" because it's already in use in created content.`
        );
    });
});
