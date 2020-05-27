import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/multipleValues";

describe("Multiple Values Test", () => {
    const { database, environment } = useContentHandler();
    const ids = { environment: mdbid(), contentModelGroup: mdbid() };

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        await database.collection("CmsEnvironment").insert({
            id: ids.environment,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null
        });

        await database.collection("CmsContentModelGroup").insert({
            id: ids.contentModelGroup,
            name: "Ungrouped",
            slug: "ungrouped",
            description: "A generic content model group",
            icon: "fas/star",
            environment: ids.environment
        });
    });

    it("should be able to create and populate multiple-values fields", async () => {
        const { content, createContentModel } = environment(ids.environment);

        const contentModel = await createContentModel({
            data: mocks.contentModel({ contentModelGroupId: ids.contentModelGroup })
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
});
