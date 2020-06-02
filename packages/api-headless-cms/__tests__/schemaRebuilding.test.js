import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/schemaRebuilding";
import { Database } from "@commodo/fields-storage-nedb";

describe("Schema Rebuilding Test", () => {
    const database = new Database();

    const { environment } = useContentHandler({ database });
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
        const changedOn = {
            prev: null,
            next: null
        };

        const { content, createContentModel } = environment(ids.environment);

        // 1. Create content model ModelOne
        await createContentModel({
            data: mocks.contentModelOne({ contentModelGroupId: ids.contentModelGroup })
        });

        changedOn.prev = changedOn.next = await database
            .collection("CmsEnvironment")
            .findOne()
            .then(item => item.changedOn);

        expect(changedOn.prev instanceof Date).toBe(true);
        expect(changedOn.next instanceof Date).toBe(true);

        // 2. Let's use the manage API.
        const modelOnes = await content("modelOne");
        const modelOne = await modelOnes.create(mocks.createModelOne);
        expect(modelOne.id).toBeTruthy();

        changedOn.next = await database
            .collection("CmsEnvironment")
            .findOne()
            .then(item => item.changedOn);

        // TODO: this shouldn't happen, inspect the code and uncomment this, and delete the next line.
        // expect(changedOn.next).toBe(changedOn.prev);
        changedOn.prev = changedOn.next;

        // 3. We just want to be sure if we add a new content model, that we are immediately able to manage it.
        await createContentModel({
            data: mocks.contentModelTwo({ contentModelGroupId: ids.contentModelGroup })
        });

        changedOn.next = await database
            .collection("CmsEnvironment")
            .findOne()
            .then(item => item.changedOn);
        expect(changedOn.next > changedOn.prev).toBe(true)

        // 2. Let's use the manage API, we don't care about this result.
        const modelTwos = await content("modelTwo");
        const modelTwo = await modelTwos.create(mocks.createModelTwo);
        expect(modelTwo.id).toBeTruthy();

        // TODO: this shouldn't happen, inspect the code and uncomment this, and delete the next line.
        // expect(changedOn.next).toBe(changedOn.prev);
        changedOn.prev = changedOn.next;
    });
});
