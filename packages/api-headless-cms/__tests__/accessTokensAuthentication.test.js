import mdbid from "mdbid";
import useContentHandler from "./utils/useContentHandler";
import useGqlHandler from "./utils/useGqlHandler";
import mocks from "./mocks/accessTokensAuthentication";
import { Database } from "@commodo/fields-storage-nedb";

// TODO: we're in a test environment and so read/preview token validation will be disabled.
// Need to add plugin configuration so that we can toggle security on/off.
describe.skip("Access Tokens Authentication Test", () => {
    const database = new Database();
    const { environment } = useContentHandler({ database });
    const { environment: environmentRead } = useContentHandler({ database, type: "read" });
    const { invoke } = useGqlHandler({ database });

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

    it("should not allow access without a valid access token", async () => {
        const CREATE_TOKEN = /* GraphQL */ `
            mutation CreateAccessToken($data: CmsAccessTokenCreateInput!) {
                cms {
                    createAccessToken(data: $data) {
                        data {
                            id
                            name
                            description
                            token
                        }
                        error {
                            code
                            message
                            data
                        }
                    }
                }
            }
        `;

        let [body] = await invoke({
            body: {
                query: CREATE_TOKEN,
                variables: {
                    data: { name: "Access Token #3", description: "...description" }
                }
            }
        });

        const accessToken = body.data.cms.createAccessToken.data;

        const { createContentModel } = environment(ids.environment);
        await createContentModel(
            mocks.productContentModel({ contentModelGroupId: ids.contentModelGroup })
        );

        const LIST_PRODUCTS = /* GraphQL */ `
            query ListProducts {
                listProducts {
                    data {
                        id
                        title
                    }
                }
            }
        `;

        [body] = await environmentRead(ids.environment).invoke({
            body: {
                query: LIST_PRODUCTS
            }
        });

        expect(body.errors[0].message).toBe("Access token is invalid!");

        [body] = await environmentRead(ids.environment).invoke({
            headers: {
                foo: "bar",
                authorization: accessToken.token
            },
            body: {
                query: LIST_PRODUCTS
            }
        });

        expect(body.errors[0].message).toBe(
            "Your Token cannot access environment Initial Environment"
        );
    });
});
