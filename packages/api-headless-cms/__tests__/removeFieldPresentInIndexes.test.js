import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/removeFieldPresentInIndexes";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Removing fields that are present in indexes", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should allow deletion of a field that is present in one or more indexes`, async () => {
        const { createContentModel, getContentModel, updateContentModel } = environment(
            initial.environment.id
        );

        const authorContentModel = await createContentModel(
            mocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        let getAuthorContentModel = await getContentModel(authorContentModel);

        let error = null;
        await updateContentModel(
            mocks.updatedAuthorContentModel({
                authorContentModelId: getAuthorContentModel.id,
                contentModelGroupId: initial.contentModelGroup.id
            })
        );

        try {
            await updateContentModel(
                mocks.removeFieldUpdateAuthorContentModel({
                    authorContentModelId: getAuthorContentModel.id,
                    contentModelGroupId: initial.contentModelGroup.id
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        getAuthorContentModel = await getContentModel(authorContentModel);
        expect(getAuthorContentModel).toEqual({
            id: getAuthorContentModel.id,
            name: "Author",
            titleFieldId: null,
            indexes: [
                {
                    fields: ["id"]
                }
            ],
            lockedFields: [],
            fields: [
                {
                    _id: "vqk-UApa0",
                    fieldId: "age",
                    multipleValues: false
                }
            ],
            layout: []
        });
    });
});
