import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/preventIdsStartingWithNumbers";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Unlocking Fields Test", () => {
    const { environment, database } = useContentHandler();

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should unlock all fields if when all content entries are deleted", async () => {
        const { createContentModel, updateContentModel } = environment(initial.environment.id);

        let error = null;
        try {
            await createContentModel(
                mocks.failModel1({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                modelId: "Provided ID 123Book is not valid - must not start with a number.",
                "fields.fieldId":
                    "Provided ID 123-title is not valid - must not start with a number."
            }
        });

        error = null;
        try {
            await createContentModel(
                mocks.failModel2({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                "fields.fieldId":
                    "Provided ID 123-title is not valid - must not start with a number."
            }
        });

        error = null;
        try {
            await createContentModel(
                mocks.failModel3({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                "fields.fieldId":
                    "Provided ID 123-title is not valid - must not start with a number."
            }
        });

        error = null;
        let contentModel;
        try {
            contentModel = await createContentModel(
                mocks.failModel4({ contentModelGroupId: initial.contentModelGroup.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        error = null;
        try {
            await updateContentModel(
                mocks.failModel5({
                    contentModelId: contentModel.id
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                "fields.fieldId":
                    "Provided ID 123-something is not valid - must not start with a number."
            }
        });
    });
});
