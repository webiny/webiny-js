import useContentHandler from "./utils/useContentHandler";
import refMocks from "./mocks/fields/refFieldReadApi.js";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import { Database } from "@commodo/fields-storage-nedb";

describe("Ref Field - READ API", () => {
    const database = new Database();
    const { environment: manageEnvironment } = useContentHandler({ database });
    const { environment: readEnvironment } = useContentHandler({ type: "read", database });
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`entries should be available in the READ API`, async () => {
        const { content, createContentModel } = manageEnvironment(initial.environment.id);

        await createContentModel({
            data: refMocks.bookContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        await createContentModel({
            data: refMocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        // 1. Create an author with books linked.
        const books = await content("book");
        const authors = await content("author");

        const createdBook1 = await books.create(refMocks.book1);
        const createdBook2 = await books.create(refMocks.book2);
        const createdBook3 = await books.create(refMocks.book3);

        const createdAuthor1 = await authors.create(
            refMocks.author1({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id
            })
        );

        const createdAuthor2 = await authors.create(
            refMocks.author2({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id
            })
        );

        await books.publish({ revision: createdBook1.id });
        await books.publish({ revision: createdBook2.id });
        await books.publish({ revision: createdBook3.id });
        await authors.publish({ revision: createdAuthor1.id });
        await authors.publish({ revision: createdAuthor2.id });

        // 2. Now that we have everything published, let's try to access the data via the READ API.

        const LIST_AUTHORS = /* GraphQL */ `
            {
                listAuthors {
                    data {
                        title
                        favoriteBook {
                            id
                            title
                        }
                        otherBooks {
                            id
                            title
                        }
                    }
                }
            }
        `;

        let [body] = await readEnvironment(initial.environment.id).invoke({
            body: {
                query: LIST_AUTHORS
            }
        });

        expect(body.data.listAuthors.data).toEqual(
            refMocks.readApiResults({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id
            })
        );
    });
});
