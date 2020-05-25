import mdbid from "mdbid";
import useApiHandler from "./utils/useApiHandler";
import { locales } from "./mocks/I18NLocales";
import mocks from "./mocks/indexesManagement";

const CREATE_CONTENT_MODEL = /* GraphQL */ `
    mutation CreateContentModel($data: CmsContentModelInput!) {
        createContentModel(data: $data) {
            data {
                name
            }
            error {
                message
                data
                code
            }
        }
    }
`;

// This is an E2E test that validates that the "CmsContentEntrySearch" table is updated accordingly on the creation
// and publishing of new content revisions. We are also checking GraphQL responses (create, list, publish) in order
// to be sure the user sees the correct data when performing these actions.
describe("Indexes Management test", () => {
    const { content, database, invoke } = useApiHandler();
    const ids = { environment: mdbid(), contentModelGroup: mdbid() };

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

    it("should update search catalog accordingly", async () => {
        // 1. Create a basic "Product" model. No additional indexes specified, which means we'll only have the "id" index.
        await invoke({
            pathParameters: { key: `manage/${ids.environment}` },
            body: {
                query: CREATE_CONTENT_MODEL,
                variables: {
                    data: {
                        name: "Product",
                        group: ids.contentModelGroup,
                        fields: [
                            {
                                _id: "vqk-UApan",
                                fieldId: "title",
                                label: {
                                    values: [
                                        {
                                            locale: locales.en.id,
                                            value: "Title"
                                        },
                                        {
                                            locale: locales.de.id,
                                            value: "Titel"
                                        }
                                    ]
                                },
                                type: "text"
                            }
                        ]
                    }
                }
            }
        });

        // 2. Create a new product entry.
        const products = await content({
            environmentId: ids.environment,
            modelId: "product"
        });

        let productRev1 = await products.create({
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Pen"
                        },
                        {
                            locale: locales.de.id,
                            value: "Kugelschreiber"
                        }
                    ]
                }
            }
        });

        // After the initial creation, we must have three entries in the database (same revision, three locales).
        let searchEntries = await database
            .collection("CmsContentEntrySearch")
            .find()
            .sort({ id: -1 });

        expect(searchEntries.length).toBe(3);
        expect(searchEntries.map(({ id, _id, ...rest }) => rest)).toEqual(
            mocks.CmsContentEntrySearch.initialProductCreated({
                environmentId: ids.environment,
                productId: productRev1.id
            })
        );

        // We should receive a single item when listing products.
        let productsList = await products.list();
        expect(productsList.length).toBe(1);
        expect(productsList[0].id).toBe(productRev1.id);

        // 3. Let's publish the created product.
        productRev1 = await products.publish({ revision: productRev1.id });
        expect(productRev1.meta.published).toBe(true);

        // We should still have three entries in the search table, only this time, every entry should be marked both
        // as the "latestVersion" and "published".
        searchEntries = await database
            .collection("CmsContentEntrySearch")
            .find()
            .sort({ id: -1 });

        expect(searchEntries.length).toBe(3);

        expect(searchEntries.map(({ id, _id, ...rest }) => rest)).toEqual(
            mocks.CmsContentEntrySearch.initialProductPublished({
                environmentId: ids.environment,
                productId: productRev1.id
            })
        );

        // 4. Create a second revision.
        let productRev2 = await products.createFrom({
            revision: productRev1.id,
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Pen 2"
                        },
                        {
                            locale: locales.de.id,
                            value: "Kugelschreiber 2"
                        }
                    ]
                }
            }
        });

        // Now, we should have six entries in the search table. The revision 1 should be still marked as published,
        // but not as latest version. The revision 2 should be marked as the latest version.
        searchEntries = await database
            .collection("CmsContentEntrySearch")
            .find()
            .sort({ id: -1 });

        expect(searchEntries.length).toBe(6);

        expect(searchEntries.map(({ id, _id, ...rest }) => rest)).toEqual(
            mocks.CmsContentEntrySearch.secondRevisionCreated({
                environmentId: ids.environment,
                productRev1,
                productRev2
            })
        );

        // We should only have one record shown in the list and that is the latest draft we just created.
        productsList = await products.list();
        expect(productsList.length).toBe(1);
        expect(productsList[0].id).toBe(productRev2.id);

        // 5. Create a new revision from a previous one, which is still a draft.
        let productRev3 = await products.createFrom({
            revision: productRev2.id,
            data: {
                title: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Pen 3"
                        },
                        {
                            locale: locales.de.id,
                            value: "Kugelschreiber 3"
                        }
                    ]
                }
            }
        });

        // Again, we should have six entries, but the previous revision 2 that was present in the search table, should
        // now be replaced with the newly created revision 3. The revision 1 must still be present.
        searchEntries = await database
            .collection("CmsContentEntrySearch")
            .find()
            .sort({ id: -1 });

        expect(searchEntries.length).toBe(6);
        expect(searchEntries.map(({ id, _id, ...rest }) => rest)).toEqual(
            mocks.CmsContentEntrySearch.thirdRevisionCreated({
                environmentId: ids.environment,
                productRev1,
                productRev3
            })
        );

        // 6. Let's publish the revision 2.
        productRev2 = await products.publish({ revision: productRev2.id });
        expect(productRev2.meta.published).toBe(true);

        searchEntries = await database
            .collection("CmsContentEntrySearch")
            .find()
            .sort({ id: -1 });

        // We should now have revisions 2 and 3 in the search table, marked as published but not latest, and marked
        // as latest and not published, respectively.
        expect(searchEntries.length).toBe(6);
        expect(searchEntries.map(({ id, _id, ...rest }) => rest)).toEqual(
            mocks.CmsContentEntrySearch.secondRevisionPublished({
                environmentId: ids.environment,
                productRev2,
                productRev3
            })
        );
    });
});
