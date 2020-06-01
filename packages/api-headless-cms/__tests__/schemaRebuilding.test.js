import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/schemaRebuilding";

describe("Schema Rebuilding Test", () => {
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

    it("should be able to create content models and immediately manage them via the manage API", async () => {
        const { content, createContentModel } = environment(ids.environment);

        // 1. Create content model ModelOne
        await createContentModel({
            data: mocks.contentModelOne({ contentModelGroupId: ids.contentModelGroup })
        });

        // 2. Let's use the manage API, we don't care about this result.
        const modelOnes = await content("modelOne");
        await modelOnes.create(mocks.createModelOne);

        // 3. We just want to be sure if we add a new content model, that we are immediately able to manage it.
        await createContentModel({
            data: mocks.contentModelTwo({ contentModelGroupId: ids.contentModelGroup })
        });

        // 2. Let's use the manage API, we don't care about this result.
        const modelTwos = await content("modelTwo");
        await modelTwos.create(mocks.createModelTwo);
    });
});
