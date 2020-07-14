import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/predefinedValues";

describe("Predefined Values Test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should be able to enable predefined values and populate entries", async () => {
        const { content, createContentModel } = environment(initial.environment.id);

        const contentModel = await createContentModel(
            mocks.contentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        expect(contentModel.fields).toEqual(mocks.createdContentModelFields);

        // 2. Create a new product entry.
        const products = await content("product");

        let product = await products.create(mocks.createProductValidValues);

        expect(product).toEqual(mocks.createProductWithValidValues(product.id));
    });
});
