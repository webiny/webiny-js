import { setupContext } from "@webiny/api/testing";
import contentModelFactory from "../../src/plugins/models/contentModel.model";
import createBase from "./utils/createModel";
import contentModels from "./data/contentModels";

export default ({ plugins }) => {
    describe("ContentModel model fields", () => {
        let context;

        beforeAll(async () => {
            // Setup context
            context = await setupContext([plugins]);
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
