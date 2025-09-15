import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { CmsGroupPlugin } from "~/plugins";
import { createContentModelGroup } from "~tests/contentAPI/mocks/contentModelGroup";
import { createImageModel } from "~tests/contentAPI/mocks/models/images";

describe("Content Model Nested Object Images", () => {
    const group = createContentModelGroup();
    const handler = useGraphQLHandler({
        path: "manage/en-US",
        plugins: [new CmsGroupPlugin(group)]
    });

    it("should properly create a content model with nested object images", async () => {
        const model = createImageModel(group);
        const [result] = await handler.createContentModelMutation({
            data: {
                ...model,
                icon: model.icon || undefined,
                description: undefined
            }
        });

        expect(result).toMatchObject({
            data: {
                createContentModel: {
                    data: {
                        modelId: "imagesModel"
                    },
                    error: null
                }
            }
        });
    });
});
