import { afterAll, describe, expect, it } from "vitest";
import { useHandler } from "~tests/graphql/handler";
import type { CmsContext } from "~/types";
import type { CmsGroup, CmsModelCreateInput } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";
import { createMappingsSnapshot } from "./mocks/mappingsSnapshot";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";

const setupGroup = async (context: CmsContext) => {
    const result = await context.container.resolve(CreateGroupUseCase).execute({
        name: "Test Group",
        description: "Test Group Description",
        icon: {
            type: "fa/fas",
            name: "fa/fas",
            value: "fa/fas"
        },
        slug: "test-group"
    });
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
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
        group: group.slug
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

        const modelResult = await context.container
            .resolve(CreateModelUseCase)
            .execute(createModelData(group));
        if (modelResult.isFail()) {
            throw modelResult.error;
        }
        const model = modelResult.value;

        const { index } = configurations.es({ model });

        const mapping = await elasticsearch.indices.getMapping({
            index
        });
        expect(mapping.body[index]).toEqual(createMappingsSnapshot());
    });
});
