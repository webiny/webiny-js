import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/multipleValues";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Multiple Values Test", () => {
    const { database, environment } = useContentHandler();

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should be able to create and populate multiple-values fields", async () => {
        const { content, createContentModel } = environment(initial.environment.id);

        const contentModel = await createContentModel({
            data: mocks.contentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        expect(contentModel.fields[0].multipleValues).toBe(false);
        expect(contentModel.fields[1].multipleValues).toBe(true);

        // 2. Create a new product entry.
        const products = await content("product");

        const product = await products.create({
            data: mocks.createProduct
        });

        expect(product).toEqual(mocks.createdProduct(product.id));
    });

    it("should not allow setting a multiple-values field as the entry title", async () => {
        const { createContentModel, updateContentModel } = environment(initial.environment.id);

        let error, product;

        // Creating should not be allowed.
        try {
            await createContentModel(
                mocks.cannotSetAsEntryTitle({
                    contentModelGroupId: initial.contentModelGroup.id,
                    titleFieldId: "someMultipleValueTextField"
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Fields that accept multiple values cannot be used as the entry title (tried to use "someMultipleValueTextField" field)`
        );

        // Updating should not be allowed as well. Let's create a new content model and try to update it.
        error = null;
        try {
            product = await createContentModel(
                mocks.cannotSetAsEntryTitle({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        try {
            await updateContentModel({
                id: product.id,
                data: {
                    titleFieldId: "someMultipleValueTextField"
                }
            });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Fields that accept multiple values cannot be used as the entry title (tried to use "someMultipleValueTextField" field)`
        );
    });

    it(`locked fields' "multipleValues" flag must not be changeable`, async () => {
        const { createContentModel, updateContentModel, content } = environment(
            initial.environment.id
        );

        let error;

        // 1. Create a content model with tags field, multipleValues is set to true.
        const productContentModel = await createContentModel(
            mocks.blogWithTagsSetToMultipleValue({
                contentModelGroupId: initial.contentModelGroup.id
            })
        );

        // 2. Create a new product entry.
        const products = await content("blog");

        await products.create(mocks.createProductWithTagsAssigned);

        try {
            await updateContentModel(
                mocks.blogWithTagsSetToSingleValue({ productId: productContentModel.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot change "multipleValues" for the "tags" field because it's already in use in created content.`
        );
    });
});
