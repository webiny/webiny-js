import sinon from "sinon";
import { createUtils } from "./utils";
import setupContentModels from "./setup/setupContentModels";
import setupDefaultEnvironment from "./setup/setupDefaultEnvironment";
import headlessPlugins from "../src/handler/plugins";
import { locales } from "./mocks/I18NLocales";

const sandbox = sinon.createSandbox();

describe("Data Manager Client", () => {
    const { useDatabase, useContext } = createUtils([
        headlessPlugins({ type: "manage", environment: "production" })
    ]);

    let context;
    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);
        let context = await useContext();
        await setupContentModels(context);
    });

    beforeEach(async () => {
        context = await useContext();
    });

    afterEach(async () => {
        sandbox.restore();
    });

    it(`should call "generateContentModelIndexes" when content model indexes are modified`, async () => {
        const spy = sandbox.spy(context.cms.dataManager, "generateContentModelIndexes");

        const contentModel = await context.models.CmsContentModel.findOne({
            query: { modelId: "category" }
        });
        contentModel.indexes = [{ fields: ["price"] }];
        await contentModel.save();

        sandbox.restore();

        expect(spy.callCount).toBe(1);
        expect(spy.args[0][0].contentModel).toBe(contentModel);
    });

    it(`should not call "generateRevisionIndexes" if content entry index fields have not changed`, async () => {
        const spy = sandbox.spy(context.cms.dataManager, "generateRevisionIndexes");

        const contentModel = await context.models.CmsContentModel.findOne({
            query: { modelId: "category" }
        });
        contentModel.indexes = [{ fields: ["price"] }];
        await contentModel.save();

        const category = new context.models.category();
        category.populate({
            title: {
                values: [
                    { locale: locales.en.id, value: "Test EN" },
                    { locale: locales.de.id, value: "Test DE" }
                ]
            },
            slug: {
                values: [
                    { locale: locales.en.id, value: "test-en" },
                    { locale: locales.de.id, value: "test-de" }
                ]
            }
        });

        await category.save();

        expect(spy.callCount).toBe(1);
    });

    it(`should call "generateRevisionIndexes" if content entry index fields have changed`, async () => {
        const spy = sandbox.spy(context.cms.dataManager, "generateRevisionIndexes");

        const contentModel = await context.models.CmsContentModel.findOne({
            query: { modelId: "category" }
        });
        contentModel.indexes = [{ fields: ["slug"] }];
        await contentModel.save();

        const slug = {
            values: [
                { locale: locales.en.id, value: "test-2-en" },
                { locale: locales.de.id, value: "test-2-de" }
            ]
        };

        const category = new context.models.category();
        category.populate({
            title: {
                values: [
                    { locale: locales.en.id, value: "Test 2 EN" },
                    { locale: locales.de.id, value: "Test 2 DE" }
                ]
            },
            slug: { ...slug }
        });

        await category.save();
        expect(spy.callCount).toBe(1);

        spy.resetHistory();

        // Index generation should not be triggered if data is not changing
        category.slug = { ...slug };

        await category.save();
        expect(spy.callCount).toBe(0);
    });
});
