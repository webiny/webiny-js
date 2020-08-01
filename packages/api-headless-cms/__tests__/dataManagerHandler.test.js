import mdbid from "mdbid";
import { createUtils } from "./utils";
import setupContentModels from "./setup/setupContentModels";
import setupDefaultEnvironment from "./setup/setupDefaultEnvironment";
import headlessPlugins from "../src/content/plugins";
import createCategories from "./mocks/createCategories.manage";
import { locales } from "./mocks/I18NLocales";

describe("Data Manager Handler", () => {
    const { useDatabase, useContext, useDataManagerHandler } = createUtils([
        headlessPlugins({ type: "manage", environment: "production" })
    ]);

    let environmentId;
    let categories;
    let models;
    const db = useDatabase();
    const collection = db.getCollection;

    beforeAll(async () => {
        environmentId = await setupDefaultEnvironment(db);
        let context = await useContext();
        await setupContentModels(context);
    });

    beforeEach(async () => {
        const context = await useContext();
        models = {
            CmsContentModel: context.models.CmsContentModel,
            CmsContentModelGroup: context.models.CmsContentModelGroup,
            Category: context.models.category
        };
        categories = await createCategories(context);
    });

    afterEach(async () => {
        await collection("CmsContentEntry").deleteMany();
        await collection("CmsContentEntrySearch").deleteMany();
    });

    it(`should generate index entries for all entries of a content model`, async () => {
        // Invoke Index Generator
        const { invoke } = useDataManagerHandler();
        let [response] = await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        expect(response.error).toBe(undefined);

        let count = await collection("CmsContentEntrySearch").countDocuments();
        expect(count).toBe(28);

        let entries = await collection("CmsContentEntrySearch")
            .find({ revision: categories[0].model.id, locale: locales.en.id })
            .toSimpleArray();

        expect(entries.length).toBe(4);

        // Get content model to fetch model indexes
        const categoryModel = await models.CmsContentModel.findOne({
            query: { modelId: "category" }
        });

        // Check if all indexes have proper values
        for (let i = 0; i < categoryModel.indexes.length; i++) {
            const { fields } = categoryModel.indexes[i];

            const entry = entries.find(entry => entry.fields === fields.join(","));
            fields.forEach((field, index) => {
                let value;
                if (field === "id") {
                    value = categories[0].model.id;
                } else {
                    value = categories[0].model[field].value(locales.en.code);
                }
                expect(entry[`v${index}`]).toBe(value);
            });
        }

        // Entries only exist if there are values for the given locale. We should get only 1 record for IT locale.
        entries = await collection("CmsContentEntrySearch")
            .find({ revision: categories[0].model.id, locale: locales.it.id })
            .toSimpleArray();

        expect(entries.length).toBe(1);
    });

    it(`should regenerate indexes when indexes are changed`, async () => {
        // Generate initial indexes
        const { invoke } = useDataManagerHandler();
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        const categoryModel = await models.CmsContentModel.findOne({
            query: { modelId: "category" }
        });

        // Update content model indexes
        categoryModel.indexes = [{ fields: ["slug"] }];
        await categoryModel.save();

        let count = await collection("CmsContentEntrySearch").countDocuments();
        expect(count).toBe(22);

        // Remove all indexes - this should only generate `fields=id` index for each locale.
        // Update: also, it will include indexes for the title-field! So, we made +7 increment here.
        categoryModel.indexes = [];
        await categoryModel.save();

        count = await collection("CmsContentEntrySearch").countDocuments();
        // 3 locales * 3 entries = 9 index entries
        // Update: +7 title entries
        expect(count).toBe(16);

        // Restore indexes
        categoryModel.indexes = [
            { fields: ["id"] },
            { fields: ["title", "slug"] },
            { fields: ["slug"] }
        ];
        await categoryModel.save();
    });

    it(`should generate index entries for a specific entry revision`, async () => {
        // Generate initial search catalog
        const { invoke } = useDataManagerHandler();
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        let count = await collection("CmsContentEntrySearch").countDocuments();
        expect(count).toBe(28);

        // Update exiting content model entry
        const category = categories[0].model;
        category.title = {
            values: [
                { locale: locales.en.id, value: "Headless EN" },
                { locale: locales.de.id, value: "Headless DE" },
                { locale: locales.it.id, value: "Headless IT" }
            ]
        };
        await category.save();

        // Re-generate indexes for this revision
        await invoke({
            environment: "production",
            action: "generateRevisionIndexes",
            contentModel: "category",
            revision: category.id
        });

        const find = {
            environment: categories[0].data.environment,
            model: "category",
            revision: category.id,
            fields: "title"
        };

        let entries = await collection("CmsContentEntrySearch")
            .find(find)
            .toSimpleArray();

        expect(entries.length).toBe(3);
        expect(entries.find(({ locale }) => locale === locales.en.id).v0).toBe("Headless EN");
        expect(entries.find(({ locale }) => locale === locales.de.id).v0).toBe("Headless DE");
        expect(entries.find(({ locale }) => locale === locales.it.id).v0).toBe("Headless IT");
    });

    it(`should delete index entries for a specific entry revision`, async () => {
        // Generate initial search catalog
        const { invoke } = useDataManagerHandler();
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        let count = await collection("CmsContentEntrySearch").countDocuments();
        expect(count).toBe(28);

        // Delete content model entry (this should delete 9 entries from Search table)
        await categories[0].model.delete();

        count = await collection("CmsContentEntrySearch").countDocuments();
        expect(count).toBe(19);
    });

    it(`should copy environment data`, async () => {
        // Generate initial search catalog
        const { invoke } = useDataManagerHandler();
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        // Insert a new environment
        const newEnvId = mdbid();
        await collection("CmsEnvironment").insertOne({
            id: newEnvId,
            name: "Staging",
            slug: "staging"
        });

        // Count records for existing environment
        let countQuery = { environment: environmentId, deleted: { $ne: true } };
        const modelsCount = await collection("CmsContentModel").countDocuments(countQuery);
        const modelGroupsCount = await collection("CmsContentModelGroup").countDocuments(
            countQuery
        );
        const entriesCount = await collection("CmsContentEntry").countDocuments(countQuery);
        const indexesCount = await collection("CmsContentEntrySearch").countDocuments({
            environment: environmentId
        });

        // Copy data
        await invoke({
            action: "copyEnvironment",
            copyFrom: environmentId,
            copyTo: newEnvId
        });

        // Count records for new environment
        countQuery = { environment: newEnvId, deleted: { $ne: true } };
        const newModelsCount = await collection("CmsContentModel").countDocuments(countQuery);
        const newModelGroupsCount = await collection("CmsContentModelGroup").countDocuments(
            countQuery
        );
        const newEntriesCount = await collection("CmsContentEntry").countDocuments(countQuery);
        const newIndexesCount = await collection("CmsContentEntrySearch").countDocuments({
            environment: newEnvId
        });

        expect(newModelsCount).toBe(modelsCount);
        expect(newModelGroupsCount).toBe(modelGroupsCount);
        expect(newEntriesCount).toBe(entriesCount);
        expect(newIndexesCount).toBe(indexesCount);
    });

    it(`should delete environment data`, async () => {
        // Generate initial search catalog
        const { invoke } = useDataManagerHandler();
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        // Insert a new environment
        const newEnvId = mdbid();
        await collection("CmsEnvironment").insertOne({
            id: newEnvId,
            name: "Staging",
            slug: "staging"
        });

        await collection("CmsEnvironmentAlias").insertOne({
            name: "Staging",
            slug: "staging",
            default: false,
            environment: newEnvId
        });

        // Copy data
        await invoke({
            action: "copyEnvironment",
            copyFrom: environmentId,
            copyTo: newEnvId
        });

        // Delete data
        await invoke({
            action: "deleteEnvironment",
            environment: newEnvId
        });

        const countQuery = { environment: newEnvId };
        expect(await collection("CmsContentModel").countDocuments(countQuery)).toBe(0);
        expect(await collection("CmsContentModelGroup").countDocuments(countQuery)).toBe(0);
        expect(await collection("CmsContentEntry").countDocuments(countQuery)).toBe(0);
        expect(await collection("CmsContentEntrySearch").countDocuments(countQuery)).toBe(0);
    });
});
