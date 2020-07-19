import mdbid from "mdbid";
import { Database } from "@commodo/fields-storage-nedb";
import useContentHandler from "./utils/useContentHandler";
import useDataManagerHandler from "./utils/useDataManager";
import { locales } from "@webiny/api-i18n/testing";
import {
    createContentModelGroup,
    createEnvironment,
    createEnvironmentAlias
} from "@webiny/api-headless-cms/testing";
import contentModels from "./mocks/genericContentModels/contentModels";
import createCategories from "./mocks/genericContentModels/categories.manage";

describe("Data Manager Handler", () => {
    const database = new Database();
    const { environment: environmentManage } = useContentHandler({ database });
    const dataManagerHandler = useDataManagerHandler({ database });

    const initial = {
        environment: null,
        environmentAlias: null,
        contentModelGroup: null,
        categories: null
    };

    beforeEach(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.environmentAlias = await createEnvironmentAlias({
            database,
            environmentId: initial.environment.id
        });
        initial.contentModelGroup = await createContentModelGroup({ database });
        initial.models = [];

        const { createContentModel } = environmentManage(initial.environment.id);
        const models = contentModels();
        for (let i = 0; i < models.length; i++) {
            let data = models[i];
            initial.models.push(await createContentModel({ data }));
        }

        const { content } = environmentManage(initial.environment.id);
        initial.categories = await createCategories({ content });
    });

    afterEach(async () => {
        await database.collection("CmsContentModel").remove({}, { multi: true });
        await database.collection("CmsContentEntry").remove({}, { multi: true });
        await database.collection("CmsContentEntrySearch").remove({}, { multi: true });
    });

    it(`should generate index entries for all entries of a content model`, async () => {
        // Invoke Index Generator
        const { invoke } = dataManagerHandler;
        let [response] = await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        expect(response.error).toBe(undefined);

        let count = await database.collection("CmsContentEntrySearch").count();
        expect(count).toBe(28);

        let entries = await database
            .collection("CmsContentEntrySearch")
            .find({ revision: initial.categories[0].id, locale: locales.en.id });

        expect(entries.length).toBe(4);

        // Get content model to fetch model indexes
        const categoryModel = await database
            .collection("CmsContentModel")
            .findOne({ modelId: "category" });

        // Check if all indexes have proper values
        for (let i = 0; i < categoryModel.indexes.length; i++) {
            const { fields } = categoryModel.indexes[i];

            const entry = entries.find(entry => entry.fields === fields.join(","));
            fields.forEach((field, index) => {
                let value;
                if (field === "id") {
                    value = initial.categories[0].id;
                } else {
                    // Let's get value for "locales.en.code", located on index "0".
                    value = initial.categories[0][field].values[0].value;
                }
                expect(entry[`v${index}`]).toBe(value);
            });
        }

        // Entries only exist if there are values for the given locale. We should get only 1 record for IT locale.
        entries = await database
            .collection("CmsContentEntrySearch")
            .find({ revision: initial.categories[0].id, locale: locales.it.id });

        expect(entries.length).toBe(1);
    });

    it(`should regenerate indexes when indexes are changed`, async () => {
        const { updateContentModel } = environmentManage(initial.environment.id);
        await updateContentModel({
            id: initial.models[0].id,
            data: {
                indexes: [{ fields: ["slug"] }]
            }
        });

        let count = await database.collection("CmsContentEntrySearch").count();
        expect(count).toBe(22);

        // Remove all indexes - this should only generate `fields=id` index for each locale.
        // Update: also, it will include indexes for the title-field! So, we made +7 increment here.
        await updateContentModel({
            id: initial.models[0].id,
            data: {
                indexes: []
            }
        });

        count = await database.collection("CmsContentEntrySearch").count();
        // 3 locales * 3 entries = 9 index entries
        // Update: +7 title entries
        expect(count).toBe(16);

        // Restore indexes
        await updateContentModel({
            id: initial.models[0].id,
            data: {
                indexes: [{ fields: ["title"] }, { fields: ["title", "slug"] }]
            }
        });
    });

    it(`should generate index entries for a specific entry revision`, async () => {
        // Generate initial search catalog
        const { invoke } = dataManagerHandler;

        let count = await database.collection("CmsContentEntrySearch").count();
        expect(count).toBe(28);

        // Update exiting content model entry
        const { content } = environmentManage(initial.environment.id);
        const categories = await content("category");
        await categories.update({
            id: initial.categories[0].id,
            data: {
                title: {
                    values: [
                        { locale: locales.en.id, value: "Headless EN" },
                        { locale: locales.de.id, value: "Headless DE" },
                        { locale: locales.it.id, value: "Headless IT" }
                    ]
                }
            }
        });

        // Re-generate indexes for this revision
        await invoke({
            environment: "production",
            action: "generateRevisionIndexes",
            contentModel: "category",
            revision: initial.categories[0].id
        });

        const find = {
            environment: initial.environment.id,
            model: "category",
            revision: initial.categories[0].id,
            fields: "title"
        };

        let entries = await database.collection("CmsContentEntrySearch").find(find);

        expect(entries.length).toBe(3);
        expect(entries.find(({ locale }) => locale === locales.en.id).v0).toBe("Headless EN");
        expect(entries.find(({ locale }) => locale === locales.de.id).v0).toBe("Headless DE");
        expect(entries.find(({ locale }) => locale === locales.it.id).v0).toBe("Headless IT");
    });

    it(`should copy environment data`, async () => {
        // Generate initial search catalog
        const { invoke } = dataManagerHandler;

        // Insert a new environment
        const newEnvId = mdbid();

        await database.collection("CmsEnvironment").insert({
            id: newEnvId,
            name: "Staging",
            slug: "staging"
        });

        // Count records for existing environment
        let countQuery = { environment: initial.environment.id, deleted: { $ne: true } };
        const modelsCount = await database.collection("CmsContentModel").count(countQuery);
        const modelGroupsCount = await database
            .collection("CmsContentModelGroup")
            .count(countQuery);
        const entriesCount = await database
            .collection("CmsContentEntry")
            .count(countQuery);
        const indexesCount = await database.collection("CmsContentEntrySearch").count({
            environment: initial.environment.id
        });

        // Copy data
        await invoke({
            action: "copyEnvironment",
            copyFrom: initial.environment.id,
            copyTo: newEnvId
        });

        // Count records for new environment
        countQuery = { environment: newEnvId, deleted: { $ne: true } };
        const newModelsCount = await database
            .collection("CmsContentModel")
            .count(countQuery);
        const newModelGroupsCount = await database
            .collection("CmsContentModelGroup")
            .count(countQuery);
        const newEntriesCount = await database
            .collection("CmsContentEntry")
            .count(countQuery);
        const newIndexesCount = await database.collection("CmsContentEntrySearch").count({
            environment: newEnvId
        });

        expect(newModelsCount).toBe(modelsCount);
        expect(newModelGroupsCount).toBe(modelGroupsCount);
        expect(newEntriesCount).toBe(entriesCount);
        expect(newIndexesCount).toBe(indexesCount);
    });

    it(`should delete environment data`, async () => {
        // Generate initial search catalog
        const { invoke } = dataManagerHandler;

        // Insert a new environment
        const newEnvId = mdbid();
        await database.collection("CmsEnvironment").insert({
            id: newEnvId,
            name: "Staging",
            slug: "staging"
        });

        await database.collection("CmsEnvironmentAlias").insert({
            name: "Staging",
            slug: "staging",
            default: false,
            environment: newEnvId
        });

        // Copy data
        await invoke({
            action: "copyEnvironment",
            copyFrom: initial.environment.id,
            copyTo: newEnvId
        });

        // Delete data
        await invoke({
            action: "deleteEnvironment",
            environment: newEnvId
        });

        const countQuery = { environment: newEnvId };
        expect(await database.collection("CmsContentModel").count(countQuery)).toBe(0);
        expect(await database.collection("CmsContentModelGroup").count(countQuery)).toBe(
            0
        );
        expect(await database.collection("CmsContentEntry").count(countQuery)).toBe(0);
        expect(await database.collection("CmsContentEntrySearch").count(countQuery)).toBe(
            0
        );
    });
});
