import { CmsContentModelGroup } from "../../src/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { hooksTracker } from "./mocks/lifecycleHooks";

describe("content model test reserved model ids", () => {
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation } = useContentGqlHandler(manageHandlerOpts);

    let contentModelGroup: CmsContentModelGroup;

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;
        // we need to reset this since we are using a singleton
        hooksTracker.reset();
    });

    test(`should not allow creation of a model the modelId set to blacklisted value`, async () => {
        const { createContentModelMutation } = useContentGqlHandler(manageHandlerOpts);

        const [response1] = await createContentModelMutation({
            data: {
                name: "Content Model",
                modelId: "contentModel",
                group: contentModelGroup.id
            }
        });

        expect(response1).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "",
                        data: null,
                        message: 'Provided model ID "contentModel" is not allowed.'
                    }
                }
            }
        });

        const [response2] = await createContentModelMutation({
            data: {
                name: "Content Model Group",
                modelId: "contentModelGroup",
                group: contentModelGroup.id
            }
        });

        expect(response2).toEqual({
            data: {
                createContentModel: {
                    data: null,
                    error: {
                        code: "",
                        data: null,
                        message: 'Provided model ID "contentModelGroup" is not allowed.'
                    }
                }
            }
        });
    });
});
