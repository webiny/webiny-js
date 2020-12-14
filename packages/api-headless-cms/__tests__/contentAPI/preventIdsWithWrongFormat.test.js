import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/preventIdsWithWrongFormat";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Fields ID Test", () => {
    const { environment, database } = useContentHandler();

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should not allow fields with fieldId set to "id"`, async () => {
        const { createContentModel } = environment(initial.environment.id);

        let error = null;
        try {
            await createContentModel(
                mocks.modelWithFieldIdSetToId({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                "fields.fieldId": 'Provided ID id is not valid - "id" is an auto-generated field.'
            }
        });

        error = null;
        try {
            await createContentModel(
                mocks.modelWithFieldIdSetToIdIncludingWhiteSpace({
                    contentModelGroupId: initial.contentModelGroup.id
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                "fields.fieldId": 'Provided ID iD is not valid - "id" is an auto-generated field.'
            }
        });

        error = null;
        try {
            await createContentModel(
                mocks.modelWithValidFieldIds({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        error = null;
    });

    it(`should trim the "fieldId" before saving to DB`, async () => {
        const { createContentModel } = environment(initial.environment.id);

        let error = null;

        let contentModel;
        try {
            contentModel = await createContentModel(
                mocks.modelWithFieldIdContainingWhiteSpace({
                    contentModelGroupId: initial.contentModelGroup.id
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        expect(contentModel.fields[0].fieldId).toEqual("title");

        error = null;
        try {
            await createContentModel(
                mocks.modelWithValidFieldIds({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        error = null;
    });
});
