import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/fields/refFieldMultipleRevisions";
import pick from "lodash/pick";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Ref Field - Multiple Revisions Test", () => {
    const { database, environment } = useContentHandler();
    const initial = {};

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
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it(`must be able to edit a revision and not affect other revisions`, async () => {
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

        const createdAuthor1 = await authors.create(
            mocks.author1({ book1Id: createdBook1.id, book2Id: createdBook2.id })
        );

        const createdAuthor1Revision2 = await authors.createFrom(
            mocks.author1Revision2({
                authorId: createdAuthor1.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id
            })
        );

        expect(await getEntries2Entries()).toEqual(
            mocks.newAuthorRevisionSearchEntries({
                environmentId: initial.environment.id,
                authorRev1Id: createdAuthor1.id,
                authorRev2Id: createdAuthor1Revision2.id,
                book1Id: createdBook1.id,
                book2Id: createdBook2.id
            })
        );


    });
});
