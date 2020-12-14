import useContentHandler from "./utils/useContentHandler";
import refMocks from "./mocks/fields/refPublishingEntries";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Ref Field - Publishing Entries Test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`should only be able to publish entries that have all linked refs published as well`, async () => {
        const { content, createContentModel } = environment(initial.environment.id);

        await createContentModel({
            data: refMocks.bookContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        await createContentModel({
            data: refMocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        });

        // 2. Create a new author entry.
        const books = await content("book");
        const authors = await content("author");

        const createdBook1 = await books.create(refMocks.book1);
        const createdBook2 = await books.create(refMocks.book2);
        const createdBook3 = await books.create(refMocks.book3);

        const createdAuthor1 = await authors.create(
            refMocks.author1({
                book1Id: createdBook1.id,
                book2Id: createdBook2.id,
                book3Id: createdBook3.id
            })
        );

        // 1. Try to publish author - should not succeed since both books are not published.
        let error;
        try {
            await authors.publish({ revision: createdAuthor1.id });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot publish - "favoriteBook" points to an unpublished content entry.`
        );

        // 2. Publish "book1". Still, publishing of author should not be allowed.
        await books.publish({ revision: createdBook1.id });

        error = null;
        try {
            await authors.publish({ revision: createdAuthor1.id });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot publish - "favoriteBook" points to an unpublished content entry.`
        );

        // 3. Publish "book2". Still won't work, book3 (set in the "otherBooks" field) isn't published.
        await books.publish({ revision: createdBook2.id });

        error = null;
        try {
            await authors.publish({ revision: createdAuthor1.id });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe(
            `Cannot publish - "otherBooks" points to an unpublished content entry.`
        );

        // 3. Publish "book3". All books are published, that means we should be able to publish the main entry.
        await books.publish({ revision: createdBook3.id });

        error = null;
        try {
            await authors.publish({ revision: createdAuthor1.id });
        } catch (e) {
            error = e;
        }

        expect(error).toBe(null);
    });
});
