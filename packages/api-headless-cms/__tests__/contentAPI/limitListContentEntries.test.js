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

        expect(bookList[0].id).toEqual(book4.id);
        expect(bookList[0].meta.value).toEqual(book4.title.value);

        expect(bookList[1].id).toEqual(book3.id);
        expect(bookList[1].meta.value).toEqual(book3.title.value);

        expect(bookList[2].id).toEqual(book2.id);
        expect(bookList[2].meta.value).toEqual(book2.title.value);

        expect(bookList[3].id).toEqual(book1.id);
        expect(bookList[3].meta.value).toEqual(book1.title.value);
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

        expect(bookList[0].id).toEqual(book4.id);
        expect(bookList[0].meta.value).toEqual(book4.title.value);

        expect(bookList[1].id).toEqual(book3.id);
        expect(bookList[1].meta.value).toEqual(book3.title.value);
    });
});
