import { afterAll, describe, expect, it } from "vitest";
import { useHandler } from "~tests/graphql/handler";
import type { CmsContext } from "~/types";
import { createCmsModel } from "@webiny/api-headless-cms";
import type { CmsGroup, CmsModelCreateInput } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";
import { createMappingsSnapshot } from "./mocks/mappingsSnapshot";

const setupGroup = async (context: CmsContext) => {
    return context.cms.createGroup({
        name: "Test Group",
        description: "Test Group Description",
        icon: "fa/fas",
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
                tenant: "root"
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
});
