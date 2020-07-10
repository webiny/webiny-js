import useContentHandler from "./utils/useContentHandler";
import refMocks from "./mocks/fields/refReferencedIn";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Ref Field - Referenced In Test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};


    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should only be able to publish entries that have all linked refs published as well`, async () => {
        const { createContentModel, deleteContentModel, updateContentModel } = environment(
            initial.environment.id
        );

        await createContentModel({
            data: refMocks.bookContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        await createContentModel({
            data: refMocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        let [authorModel, bookModel] = await database
            .collection("CmsContentModel")
            .find()
            .sort({ modelId: 1 });

        expect(authorModel.modelId).toEqual("author");
        expect(authorModel.refFields).toEqual([
            {
                fieldId: "favoriteBook",
                modelId: "book"
            },
            {
                fieldId: "otherBooks",
                modelId: "book"
            }
        ]);
        expect(authorModel.referencedIn).toEqual([]);

        expect(bookModel.modelId).toEqual("book");
        expect(bookModel.refFields).toEqual([]);

        expect(bookModel.referencedIn).toEqual([
            {
                fieldId: "favoriteBook",
                modelId: "author"
            },
            {
                fieldId: "otherBooks",
                modelId: "author"
            }
        ]);

        let error;

        try {
            await deleteContentModel({ id: bookModel.id });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot delete content model because it's referenced in the "author" model ("favoriteBook" field).`
        );

        await updateContentModel(
            refMocks.removeFavoriteBookField({ contentModelId: authorModel.id })
        );

        error = null;

        try {
            await deleteContentModel({ id: bookModel.id });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot delete content model because it's referenced in the "author" model ("otherBooks" field).`
        );

        await updateContentModel(
            refMocks.removeOtherBooksField({ contentModelId: authorModel.id })
        );

        await deleteContentModel({ id: bookModel.id });

        let [deletedBookModel] = await database
            .collection("CmsContentModel")
            .find({ deleted: true });

        expect(deletedBookModel.id).toBe(bookModel.id);
    });
});
