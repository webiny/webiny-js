import { setupContext } from "@webiny/graphql/testing";
import contentModelFactory from "../../src/handler/plugins/models/contentModel.model";
import createBase from "./utils/createModel";
import contentModels from "./data/contentModels";
import headlessPlugins from "../../src/handler/plugins";

export default ({ plugins }) => {
    describe("ContentModel model fields", () => {
        let context;

        beforeAll(async () => {
            // Setup context
            context = await setupContext([
                plugins,
                headlessPlugins({ type: "read", environment: "default" })
            ]);
        });

        test("toStorage returns correct values", async () => {
            const ContentModel = contentModelFactory({ createBase, context });

            for (let i = 0; i < contentModels.length; i++) {
                const contentModel = contentModels[i];
                const category = new ContentModel();
                category.populate(contentModel);
                const storageData = await category.toStorage();
                expect(storageData).toMatchObject(contentModel);
            }
        });
    });
};
