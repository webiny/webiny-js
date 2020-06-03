import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/fields/fieldsBasicCrud";
import pick from "lodash/pick";

describe("Fields Test", () => {
    const { database, environment } = useContentHandler();
    const ids = { environment: mdbid(), contentModelGroup: mdbid() };

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
                        "entry1ClassId",
                        "entry2ClassId",
                        "environment"
                    ])
                )
            );

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        await database.collection("CmsEnvironment").insert({
            id: ids.environment,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null
        });

        await database.collection("CmsContentModelGroup").insert({
            id: ids.contentModelGroup,
            name: "Ungrouped",
            slug: "ungrouped",
            description: "A generic content model group",
            icon: "fas/star",
            environment: ids.environment
        });
    });

    it(`should be able to assert basic CRUD operations`, async () => {
        const { content, createContentModel } = environment(ids.environment);

        await createContentModel({
            data: mocks.bookContentModel({ contentModelGroupId: ids.contentModelGroup })
        });

        await createContentModel({
            data: mocks.authorContentModel({ contentModelGroupId: ids.contentModelGroup })
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
                environmentId: ids.environment,
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
                environmentId: ids.environment,
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
                environmentId: ids.environment,
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
                environmentId: ids.environment,
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
                environmentId: ids.environment,
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
