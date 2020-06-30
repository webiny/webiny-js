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
        const { createContentModel } = environment(initial.environment.id);

        await createContentModel({
            data: refMocks.bookContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        let error;
        try {
            await createContentModel({
                data: refMocks.authorContentModel({
                    contentModelGroupId: initial.contentModelGroup.id
                })
            });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot save content model because the ref field "favoriteBook" references a content model (book) that has no title field assigned.`
        );

        error = null;
        try {
            await createContentModel({
                data: refMocks.authorWithoutBookRefFields({
                    contentModelGroupId: initial.contentModelGroup.id
                })
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);
    });
});
