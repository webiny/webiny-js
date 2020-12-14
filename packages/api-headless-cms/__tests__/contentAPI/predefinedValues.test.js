import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/predefinedValues";

describe("Predefined Values Test", () => {
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

    it("should be able to enable predefined values and populate entries", async () => {
        const { content, createContentModel } = environment(ids.environment);

        const contentModel = await createContentModel(
            mocks.contentModel({ contentModelGroupId: ids.contentModelGroup })
        );

        expect(contentModel.fields).toEqual(mocks.createdContentModelFields);

        // 2. Create a new product entry.
        const products = await content("product");

        let product = await products.create(mocks.createProductValidValues);

        expect(product).toEqual(mocks.createProductWithValidValues(product));
    });
});
