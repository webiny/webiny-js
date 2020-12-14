import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/modelDeletionGqlFieldsHiding";
import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";

describe("Refresh schema on content model deletion", () => {
    const { environment, database } = useContentHandler();

    const initial = {};

    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should refresh schema on model deletion", async () => {
        const { createContentModel, deleteContentModel, content } = environment(
            initial.environment.id
        );

        const contentModel = await createContentModel(
            mocks.authorContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        const authors = await content("author");

        const authorsList = await authors.list();

        // 1. Listing authors should work.
        expect(authorsList).toEqual([]);

        // 2. Let's delete the content model, and check if the model was removed from the schema.
        await deleteContentModel({ id: contentModel.id });

        // This should result in an error (types no longer existing).
        let error = null;
        try {
            await authors.list();
        } catch (e) {
            error = e;
        }

        expect(error).toEqual([
            {
                extensions: {
                    code: "GRAPHQL_VALIDATION_FAILED"
                },
                locations: [
                    {
                        column: 35,
                        line: 2
                    }
                ],
                message: 'Unknown type "AuthorListWhereInput".'
            },
            {
                extensions: {
                    code: "GRAPHQL_VALIDATION_FAILED"
                },
                locations: [
                    {
                        column: 65,
                        line: 2
                    }
                ],
                message: 'Unknown type "AuthorListSorter".'
            },
            {
                extensions: {
                    code: "GRAPHQL_VALIDATION_FAILED"
                },
                locations: [
                    {
                        column: 13,
                        line: 3
                    }
                ],
                message: 'Cannot query field "listAuthors" on type "Query".'
            }
        ]);
    });
});
