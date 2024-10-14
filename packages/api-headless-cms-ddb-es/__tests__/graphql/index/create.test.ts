import { useHandler } from "~tests/graphql/handler";
import { CmsContext } from "~/types";
import { createCmsModel } from "@webiny/api-headless-cms";
import { CmsGroup, CmsModelCreateInput } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";
import { createMappingsSnapshot } from "./mocks/mappingsSnapshot";

const setupGroup = async (context: CmsContext) => {
    return context.cms.createGroup({
        name: "Test Group",
        description: "Test Group Description",
        icon: {
            type: "emoji",
            name: "thumbs_up",
            value: "👍"
        },
        slug: "test-group"
    });
};

const modelData = {
    name: "Context Model",
    modelId: "contextModel",
    singularApiName: "ContextModel",
    pluralApiName: "ContextModels",
    description: "Context Model",
    fields: [],
    layout: [],
    titleFieldId: "id"
};
const createModelData = (group: CmsGroup): CmsModelCreateInput => {
    return {
        ...modelData,
        group: group.id
    };
};

describe("create index", () => {
    afterAll(async () => {
        const { elasticsearch } = useHandler();
        const { index } = configurations.es({
            model: {
                modelId: modelData.modelId,
                tenant: "root",
                locale: "en-US"
            }
        });
        try {
            await elasticsearch.indices.delete({
                index
            });
        } catch {}
    });

    it("should properly create index when creating model via the context.cms.createModel method", async () => {
        const { createContext, elasticsearch } = useHandler();
        const context = await createContext();

        const group = await setupGroup(context);

        const model = await context.cms.createModel(createModelData(group));

        const { index } = configurations.es({ model });

        const mapping = await elasticsearch.indices.getMapping({
            index
        });
        expect(mapping.body[index]).toEqual(createMappingsSnapshot());
    });

    it("should properly create index when using context.cms.initializeModel method", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [
                createCmsModel({
                    ...modelData,
                    fields: [
                        {
                            id: "title",
                            fieldId: "title",
                            label: "Title",
                            type: "text",
                            validation: [],
                            listValidation: []
                        }
                    ],
                    layout: [["title"]],
                    group: {
                        id: "test-group",
                        name: "Test Group"
                    }
                })
            ]
        });
        const context = await createContext();

        const response = await context.cms.initializeModel("contextModel", {});

        expect(response).toEqual(true);

        const { index } = configurations.es({
            model: {
                modelId: modelData.modelId,
                tenant: "root",
                locale: "en-US"
            }
        });

        const mapping = await elasticsearch.indices.getMapping({
            index
        });
        expect(mapping.body[index]).toEqual(createMappingsSnapshot());
    });
});
