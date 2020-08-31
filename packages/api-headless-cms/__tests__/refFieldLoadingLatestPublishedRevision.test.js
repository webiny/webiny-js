import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/fields/refFieldLoadingLatestPublishedRevision";
import pick from "lodash/pick";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import { Database } from "@commodo/fields-storage-nedb";
import { locales } from "@webiny/api-i18n/testing";

describe("Ref Field - loading of latest and published revisions", () => {
    const database = new Database();
    const { environment } = useContentHandler({ database });
    const { environment: environmentRead } = useContentHandler({ database, type: "read" });

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
                        "environment",
                        "entry2ParentId"
                    ])
                )
            );

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`must load latest / published parent revisions accordingly `, async () => {
        const { content, createContentModel, invoke } = environment(initial.environment.id);
        const { invoke: invokeRead } = environmentRead(initial.environment.id);

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

        let createdAuthor1 = await authors.create(
            mocks.author1({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        let entries2entries = await getEntries2Entries();

        expect(entries2entries).toEqual(
            mocks.createdAuthor1Entries2Entries({
                environmentId: initial.environment.id,
                authorId: createdAuthor1.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id,
                book4Id: createdBook4.id
            })
        );

        // The books are not published. But we should still see them in the MANAGE API.
        let [response] = await invoke({
            body: {
                query: MANAGE_LIST_QUERY
            }
        });

        expect(response.data.content.data).toEqual([
            {
                id: createdAuthor1.id,
                savedOn: createdAuthor1.savedOn,
                books: {
                    value: [
                        {
                            id: createdBook2.id,
                            title: {
                                value: "Book2-en"
                            }
                        },
                        {
                            id: createdBook1.id,
                            title: {
                                value: "Book1-en"
                            }
                        }
                    ]
                }
            }
        ]);

        // Let's try listing authors. Nothing should be visible though - author not published.
        [response] = await invokeRead({
            body: {
                query: READ_LIST_QUERY
            }
        });

        expect(response).toEqual({ data: { content: { data: [] } } });

        // In order to be able to publish the Author entry, we must first publish books.
        await books.publish({ revision: createdBook1.id });
        await books.publish({ revision: createdBook2.id });
        await books.publish({ revision: createdBook3.id });
        await books.publish({ revision: createdBook4.id });
        await authors.publish({ revision: createdAuthor1.id });

        // Now we should have an Author entry, with books in it.
        [response] = await invokeRead({
            body: {
                query: READ_LIST_QUERY
            }
        });

        createdAuthor1 = await authors.read({ id: createdAuthor1.id });
        expect(response.data.content.data).toEqual([
            {
                id: createdAuthor1.id,
                savedOn: createdAuthor1.savedOn,
                books: [
                    {
                        id: createdBook2.id,
                        title: "Book2-en"
                    },
                    {
                        id: createdBook1.id,
                        title: "Book1-en"
                    }
                ]
            }
        ]);

        const createdBook1Rev2 = await books.createFrom({ revision: createdBook1.id });
        await books.update({
            id: createdBook1Rev2.id,
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Book1-en-UPDATED"
                        },
                        {
                            locale: locales.de.id,
                            value: "Book1-de-UPDATED"
                        }
                    ]
                }
            }
        });

        const createdBook2Rev2 = await books.createFrom({ revision: createdBook2.id });
        await books.update({
            id: createdBook2Rev2.id,
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Book2-en-UPDATED"
                        },
                        {
                            locale: locales.de.id,
                            value: "Book2-de-UPDATED"
                        }
                    ]
                }
            }
        });

        // Now, if we try to execute the same listAuthors query, on the MANAGE API, we should see the newest books revisions.
        [response] = await invoke({
            body: {
                query: MANAGE_LIST_QUERY
            }
        });

        expect(response.data.content.data).toEqual([
            {
                id: createdAuthor1.id,
                savedOn: createdAuthor1.savedOn,
                books: {
                    value: [
                        {
                            id: createdBook2Rev2.id,
                            title: {
                                value: "Book2-en-UPDATED"
                            }
                        },
                        {
                            id: createdBook1Rev2.id,
                            title: {
                                value: "Book1-en-UPDATED"
                            }
                        }
                    ]
                }
            }
        ]);

        // On the READ API, we should still see the old records.
        [response] = await invokeRead({
            body: {
                query: READ_LIST_QUERY
            }
        });

        expect(response.data.content.data).toEqual([
            {
                id: createdAuthor1.id,
                savedOn: createdAuthor1.savedOn,
                books: [
                    {
                        id: createdBook2.id,
                        title: "Book2-en"
                    },
                    {
                        id: createdBook1.id,
                        title: "Book1-en"
                    }
                ]
            }
        ]);

        // If we execute the same list query after we've published new book revisions, we should see those in the READ API.
        await books.publish({ revision: createdBook1Rev2.id });
        await books.publish({ revision: createdBook2Rev2.id });

        [response] = await invokeRead({
            body: {
                query: READ_LIST_QUERY
            }
        });

        expect(response.data.content.data).toEqual([
            {
                id: createdAuthor1.id,
                savedOn: createdAuthor1.savedOn,
                books: [
                    {
                        id: createdBook2Rev2.id,
                        title: "Book2-en-UPDATED"
                    },
                    {
                        id: createdBook1Rev2.id,
                        title: "Book1-en-UPDATED"
                    }
                ]
            }
        ]);

        // If we unpublish both revisions, we should not be able to see them in the READ API.
        await books.unpublish({ revision: createdBook1Rev2.id });
        await books.unpublish({ revision: createdBook2Rev2.id });

        [response] = await invokeRead({
            body: {
                query: READ_LIST_QUERY
            }
        });

        expect(response.data.content.data).toEqual([
            {
                id: createdAuthor1.id,
                savedOn: createdAuthor1.savedOn,
                books: []
            }
        ]);

        /* const aa = await database
            .collection("CmsContentEntry")
            .find()
            .sort({ id: 1 })
            .then(response => response.map(item => item));

        console.log(aa);*/

        // Now, let's create a new revision of the createdBook1.
        /*
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
        );*/
    });
});

const MANAGE_LIST_QUERY = /* GraphQL */ `
    query listAuthors {
        content: listAuthors {
            data {
                id
                savedOn
                books {
                    value {
                        id
                        title {
                            value
                        }
                    }
                }
            }
        }
    }
`;

const READ_LIST_QUERY = /* GraphQL */ `
    query listAuthors {
        content: listAuthors {
            data {
                id
                savedOn
                books {
                    id
                    title
                }
            }
        }
    }
`;
