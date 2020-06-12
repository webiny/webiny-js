import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/addIndexOnTitleFieldChange";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Creating indexes on title field change", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should create an index when a new title field has been set`, async () => {
        const { createContentModel, getContentModel, updateContentModel } = environment(
            initial.environment.id
        );

        const authorContentModel = await createContentModel(
            mocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        const getAuthorContentModel = await getContentModel(authorContentModel);
        expect(getAuthorContentModel.indexes).toEqual([
            {
                fields: ["id"]
            }
        ]);

        let updatedAuthorContentModel = await updateContentModel(
            mocks.updatedAuthorContentModel({
                authorContentModelId: getAuthorContentModel.id,
                contentModelGroupId: initial.contentModelGroup.id
            })
        );

        let getUpdatedAuthorContentModel = await getContentModel(updatedAuthorContentModel);

        expect(getUpdatedAuthorContentModel.indexes).toEqual([
            {
                fields: ["id"]
            },
            {
                fields: ["title"]
            }
        ]);

        updatedAuthorContentModel = await updateContentModel(
            mocks.newTitleFieldUpdateAuthorContentModel({
                authorContentModelId: getAuthorContentModel.id,
                contentModelGroupId: initial.contentModelGroup.id
            })
        );

        getUpdatedAuthorContentModel = await getContentModel(updatedAuthorContentModel);

        expect(getUpdatedAuthorContentModel.indexes).toEqual([
            {
                fields: ["id"]
            },
            {
                fields: ["title"]
            },
            {
                fields: ["sku"]
            }
        ]);
    });
});
