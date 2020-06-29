import useContentHandler from "./utils/useContentHandler";
import lockedFieldsMocks from "./mocks/fields/lockedFields";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Locked Field - Invariant test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should only update content model if locked fields invariant is valid`, async () => {
        const { createContentModel, updateContentModel, content } = environment(
            initial.environment.id
        );

        await createContentModel({
            data: lockedFieldsMocks.bookContentModel({
                contentModelGroupId: initial.contentModelGroup.id
            })
        });

        await createContentModel({
            data: lockedFieldsMocks.authorContentModel({
                contentModelGroupId: initial.contentModelGroup.id
            })
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
            }
        ]);
        expect(authorModel.lockedFields).toEqual([]);

        expect(bookModel.modelId).toEqual("book");
        expect(bookModel.lockedFields).toEqual([]);

        const book = await content(bookModel.modelId);
        // create a book
        const book1 = await book.create(lockedFieldsMocks.book1);

        const author = await content(authorModel.modelId);
        // create an author
        const author1 = await author.create(lockedFieldsMocks.author1({ book1Id: book1.id }));

        [authorModel] = await database
            .collection("CmsContentModel")
            .find()
            .sort({ modelId: 1 });

        expect(authorModel.lockedFields).toEqual([
            {
                fieldId: "title",
                type: "text",
                multipleValues: false
            },
            {
                fieldId: "favoriteBook",
                type: "ref",
                multipleValues: false,
                modelId: "book"
            },
            {
                fieldId: "simple",
                type: "datetime",
                multipleValues: false,
                formatType: "date"
            }
        ]);

        let error;

        try {
            await updateContentModel(
                lockedFieldsMocks.removeFavoriteBookField({ contentModelId: authorModel.id })
            );
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot remove the field "favoriteBook" because it's already in use in created content.`
        );

        error = null;
        try {
            await updateContentModel(
                lockedFieldsMocks.updateFavoriteBookFieldType({ contentModelId: authorModel.id })
            );
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe(
            `Cannot change field type for the "favoriteBook" field because it's already in use in created content.`
        );

        error = null;
        try {
            await updateContentModel(
                lockedFieldsMocks.updateDateTimeFieldType({ contentModelId: authorModel.id })
            );
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe(
            `Cannot change "type" for the "simple" field because it's already in use in created content.`
        );

        error = null;
        try {
            await updateContentModel(
                lockedFieldsMocks.updateRefFieldModelId({ contentModelId: authorModel.id })
            );
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe(
            `Cannot change "modelId" for the "favoriteBook" field because it's already in use in created content.`
        );

        // delete author entry
        await author.delete({ revision: author1.id });

        const updatedAuthorModel = await updateContentModel(
            lockedFieldsMocks.updateDateTimeFieldType({ contentModelId: authorModel.id })
        );
        expect(updatedAuthorModel.lockedFields).toStrictEqual([]);
    });
});
