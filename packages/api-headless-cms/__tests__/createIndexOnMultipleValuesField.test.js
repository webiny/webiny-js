import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/createIndexOnMultipleValuesField";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Multiple Values Test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should prevent the creation of an index that includes a multiple values field in the fields list`, async () => {
        const { createContentModel, updateContentModel } = environment(initial.environment.id);

        let error;
        const productContentModel = await createContentModel(
            mocks.blogWithTagsSetToMultipleValue({
                contentModelGroupId: initial.contentModelGroup.id
            })
        );

        let newSome;
        const field = "tags";
        try {
            newSome = await updateContentModel({
                id: productContentModel.id,
                data: {
                    indexes: {
                        fields: ["tags"]
                    }
                }
            });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot create a new index with the "${field}" field included because the field accepts multiple values.`
        );
    });
});
