import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/fields/refFieldCrud";
import pick from "lodash/pick";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Ref Field - CRUD Test", () => {
    const { database, environment } = useContentHandler();
    const getEntries2Entries = () =>
        database
            .collection("CmsEntries2Entries")
            .find()
            .sort({ id: 1 })
            .then(response =>
                response.map(item =>
                    pick(item, [
                        "locale",
                        "deleted",
                        "entry1",
                        "entry2",
                        "entry1FieldId",
                        "entry1ModelId",
                        "entry2ModelId",
                        "environment"
                    ])
                )
            );

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should be able to assert basic CRUD operations`, async () => {
        const { content, createContentModel } = environment(initial.environment.id);

        await createContentModel({
            data: mocks.bookContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        await createContentModel({
            data: mocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        // 2. Create a new author entry.
        const books = await content("book");
        const authors = await content("author");

        const createdBook1 = await books.create(mocks.book1);
        const createdBook2 = await books.create(mocks.book2);
        const createdBook3 = await books.create(mocks.book3);
        const createdBook4 = await books.create(mocks.book4);

        const createdAuthor1 = await authors.create(
            mocks.author1({ book1Id: createdBook1.id, book2Id: createdBook2.id })
        );

        let entries2entries = await getEntries2Entries();

        expect(entries2entries).toEqual(
            mocks.createdAuthor1Entries2Entries({
                environmentId: initial.environment.id,
                authorId: createdAuthor1.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id
            })
        );

        const author1 = await authors.read({ id: createdAuthor1.id });
        expect(author1.books).toEqual(
            mocks.createdAuthor1({ book1Id: createdBook1.id, book2Id: createdBook2.id })
        );

        await authors.update(
            mocks.updateAuthor1({
                authorId: author1.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        expect(await getEntries2Entries()).toEqual(
            mocks.updatedAuthor1Entries2Entries({
                environmentId: initial.environment.id,
                authorId: createdAuthor1.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        const createdAuthor2 = await authors.create(
            mocks.author2({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        const author2 = await authors.read({ id: createdAuthor2.id });
        expect(author2.books).toEqual(
            mocks.createdAuthor2({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        expect(await getEntries2Entries()).toEqual(
            mocks.createdAuthor2Entries2Entries({
                environmentId: initial.environment.id,
                author1Id: createdAuthor1.id,
                author2Id: createdAuthor2.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        await authors.update(
            mocks.updateAuthor2({
                authorId: author2.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        expect(await getEntries2Entries()).toEqual(
            mocks.updatedAuthor2Entries2Entries({
                environmentId: initial.environment.id,
                author1Id: createdAuthor1.id,
                author2Id: createdAuthor2.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        // Remove all books from author1 and author2.
        await authors.update(
            mocks.updateAuthorRemoveBooks({
                authorId: author1.id
            })
        );

        await authors.update(
            mocks.updateAuthorRemoveBooks({
                authorId: author2.id
            })
        );

        expect(await getEntries2Entries()).toEqual(
            mocks.updatedAuthorsRemovedBooksEntries2Entries({
                environmentId: initial.environment.id,
                author1Id: createdAuthor1.id,
                author2Id: createdAuthor2.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );
    });
});
