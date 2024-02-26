import { createCmsEntryElasticsearchValuesModifier } from "~/plugins";
import { CmsEntry, CmsIdentity, CmsModel } from "@webiny/api-headless-cms/types";

interface MockCmsEntryValues {
    title: string;
    age: number;
}

const mockModel: CmsModel = {
    locale: "en-US",
    tenant: "root",
    modelId: "abcdefghijklmn",
    name: "Test model",
    description: "",
    layout: [],
    fields: [],
    singularApiName: "TestModel",
    pluralApiName: "TestModels",
    titleFieldId: "id",
    group: {
        id: "group",
        name: "group"
    },
    webinyVersion: "0.0.0"
};
const createdBy: CmsIdentity = {
    id: "a",
    displayName: "a",
    type: "a"
};

const mockEntry: CmsEntry<MockCmsEntryValues> = {
    id: "abcdefg#0001",
    entryId: "abcdefg",
    location: {
        folderId: "root"
    },
    values: {
        title: "Initial title",
        age: 55
    },
    status: "draft",
    locked: false,
    locale: "en-US",
    tenant: "root",
    webinyVersion: "0.0.0",
    createdBy,
    ownedBy: createdBy,
    meta: {},
    createdOn: new Date().toISOString(),
    savedOn: new Date().toISOString(),
    modelId: mockModel.modelId,
    version: 1
};

const getMockData = () => {
    return {
        model: structuredClone<CmsModel>(mockModel),
        entry: structuredClone<CmsEntry<MockCmsEntryValues>>(mockEntry),
        values: structuredClone<MockCmsEntryValues>(mockEntry.values)
    };
};

describe("entry values modifier", () => {
    it("should modify the original values with a single plugin", async () => {
        const { model, values: initialValues, entry } = getMockData();
        let values = structuredClone(initialValues);

        const modifier = createCmsEntryElasticsearchValuesModifier<MockCmsEntryValues>(
            async ({ setValues }) => {
                setValues(() => {
                    return {
                        title: "Test title"
                    };
                });
            }
        );

        values = await modifier.modify({
            entry,
            model,
            values
        });

        expect(values).toEqual({
            title: "Test title"
        });
        expect(values.age).toBeUndefined();
    });

    it("should modify the original values with multiple plugins", async () => {
        const { model, values: initialValues, entry } = getMockData();
        let values = structuredClone(initialValues);
        const titleModifier = createCmsEntryElasticsearchValuesModifier<MockCmsEntryValues>(
            async ({ setValues }) => {
                setValues(() => {
                    return {
                        title: "Test title"
                    };
                });
            }
        );

        values = await titleModifier.modify({
            entry,
            model,
            values
        });

        expect(values).toEqual({
            title: "Test title"
        });
        expect(values.age).toBeUndefined();

        const ageModifier = createCmsEntryElasticsearchValuesModifier<MockCmsEntryValues>(
            async ({ setValues }) => {
                setValues(prev => {
                    return {
                        ...prev,
                        age: 2
                    };
                });
            }
        );

        values = await ageModifier.modify({
            entry,
            model,
            values
        });
        expect(values).toEqual({
            title: "Test title",
            age: 2
        });
    });

    it("should not modify anything because model is not supported", async () => {
        const { model } = getMockData();
        const nothingWillGetModified =
            createCmsEntryElasticsearchValuesModifier<MockCmsEntryValues>({
                models: ["nonExisting"],
                modifier: async ({ setValues }) => {
                    setValues(() => {
                        return {
                            title: "Test title"
                        };
                    });
                }
            });

        const result = nothingWillGetModified.canModify(model.modelId);
        expect(result).toEqual(false);
    });
});
