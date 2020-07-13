import useContentHandler from "./utils/useContentHandler";
import refMocks from "./mocks/fields/refInvalidReferences";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Ref Field - Invalid References In Test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should not allow selection of a ref model that doesn't have a title field`, async () => {
        const { createContentModel, updateContentModel } = environment(initial.environment.id);

        await createContentModel(
            refMocks.bookContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        let error;
        try {
            await createContentModel(
                refMocks.authorContentModel({
                    contentModelGroupId: initial.contentModelGroup.id
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot save content model because the ref field "favoriteBook" references a content model "book" that has no title field assigned.`
        );

        error = null;
        try {
            await createContentModel(
                refMocks.authorWithoutBookRefFields({
                    contentModelGroupId: initial.contentModelGroup.id
                })
            );
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);

        // The following is basically the same test, but CRUD operations are done in the same order as in the UI.
        // So, first we create a model, then we update it with fields.
        const modelA = await createContentModel(
            refMocks.modelA({ contentModelGroupId: initial.contentModelGroup.id })
        );

        const modelB = await createContentModel(
            refMocks.modelBCreate({ contentModelGroupId: initial.contentModelGroup.id })
        );

        error = null;
        try {
            await updateContentModel(refMocks.modelBUpdate({ modelId: modelB.id }));
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot save content model because the ref field "a" references a content model "a" that has no title field assigned.`
        );

        error = null;
        try {
            await updateContentModel(refMocks.modelAUpdate({ modelId: modelA.id }));
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);
    });
});
