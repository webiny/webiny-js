import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/limitListContentEntries";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("List content entries with limit param test", () => {
    const { environment, database } = useContentHandler();

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should return all 4 entries when no limit specified", async () => {
        const { content, createContentModel } = environment(initial.environment.id);

        await createContentModel(mocks.book({ contentModelGroupId: initial.contentModelGroup.id }));

        const books = await content("book");

        const book1 = await books.create(mocks.book1);
        const book2 = await books.create(mocks.book2);
        const book3 = await books.create(mocks.book3);
        const book4 = await books.create(mocks.book4);

        const bookList = await books.list({});

        expect(bookList.length).toBe(4);

        // TODO: Should be clean up the entries
        await books.delete({ revision: book1.id });
        await books.delete({ revision: book2.id });
        await books.delete({ revision: book3.id });
        await books.delete({ revision: book4.id });
    });

    it("should return two entries when limit is set to 2", async () => {
        const { content, createContentModel } = environment(initial.environment.id);

        await createContentModel(mocks.book({ contentModelGroupId: initial.contentModelGroup.id }));
        const books = await content("book");

        const book1 = await books.create(mocks.book1);
        const book2 = await books.create(mocks.book2);
        const book3 = await books.create(mocks.book3);
        const book4 = await books.create(mocks.book4);

        const bookList = await books.list({ limit: 2 });

        expect(bookList.length).toBe(2);

        // TODO: Should be clean up the entries
        await books.delete({ revision: book1.id });
        await books.delete({ revision: book2.id });
        await books.delete({ revision: book3.id });
        await books.delete({ revision: book4.id });
    });
});
