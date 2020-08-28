import { createUtils } from "./utils";
import setupContentModels from "./setup/setupContentModels";
import setupDefaultEnvironment from "./setup/setupDefaultEnvironment";
import headlessPlugins from "../src/content/plugins";
import createCategories from "./mocks/createCategories.manage";

describe("Data Manager Hooks", () => {
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

    it(`should execute hook plugin (update)`, async () => {
        let hookExecuted = null;
        const { invoke } = useDataManagerHandler([
            {
                type: "cms-data-manager-entry-hook",
                hook(payload) {
                    hookExecuted = payload;
                }
            }
        ]);

        // Setup initial search catalog
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        // Update entry to trigger hooks
        await invoke({
            environment: "production",
            action: "generateRevisionIndexes",
            contentModel: "category",
            revision: categories[0].model.id
        });

        expect(hookExecuted).toMatchObject({
            type: "entry-update",
            environment: "production",
            contentModel: "category",
            entry: {
                id: categories[0].model.id
            }
        });
    });

    it(`should execute hook plugin (delete)`, async () => {
        let hookExecuted = null;
        const { invoke } = useDataManagerHandler([
            {
                type: "cms-data-manager-entry-hook",
                hook(payload) {
                    hookExecuted = payload;
                }
            }
        ]);

        // Setup initial search catalog
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        // Update entry to trigger hooks
        await invoke({
            environment: "production",
            action: "deleteRevisionIndexes",
            contentModel: "category",
            revision: categories[0].model.id
        });

        expect(hookExecuted).toMatchObject({
            type: "entry-delete",
            environment: "production",
            contentModel: "category",
            entry: {
                id: categories[0].model.id
            }
        });
    });

    it(`should ignore errors in hook plugins`, async () => {
        const { invoke } = useDataManagerHandler([
            {
                type: "cms-data-manager-entry-hook",
                hook() {
                    throw Error("Broken hook!");
                }
            }
        ]);

        // Setup initial search catalog
        await invoke({
            environment: "production",
            action: "generateContentModelIndexes",
            contentModel: "category"
        });

        // Update entry to trigger hooks
        const [result] = await invoke({
            environment: "production",
            action: "generateRevisionIndexes",
            contentModel: "category",
            revision: categories[0].model.id
        });

        expect(result.error).toBeUndefined();
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
});
