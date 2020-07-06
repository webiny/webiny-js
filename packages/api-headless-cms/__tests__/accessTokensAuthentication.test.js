import useContentHandler from "./utils/useContentHandler";
import useGqlHandler from "./utils/useGqlHandler";
import mocks from "./mocks/accessTokensAuthentication";
import { Database } from "@commodo/fields-storage-nedb";
import {
    createContentModelGroup,
    createEnvironment,
    createAccessToken
} from "@webiny/api-headless-cms/testing";
// import { createToken } from "@webiny/api-security/testing"; // TODO: @andrei make this

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

// TODO: we're in a test environment and so read/preview token validation will be disabled.
// Need to add plugin configuration so that we can toggle security on/off.
describe("Access Tokens Authentication Test", () => {
    const database = new Database();
    const { environment: environmentManage } = useContentHandler({ database });
    const { environment: environmentRead } = useContentHandler({ database, type: "read" });
    const { invoke } = useGqlHandler({ database });

    const initial = {};
    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
        initial.accessToken = await createAccessToken({ database });
    });

    it("should not allow access without a valid access token", async () => {
        const { createContentModel } = environmentManage(initial.environment.id);
        await createContentModel(
            mocks.productContentModel({ contentModelGroupId: initial.contentModelGroup.id })
        );

        let [body] = await environmentRead(initial.environment.id).invoke({
            body: {
                query: LIST_PRODUCTS
            }
        });

        console.log(body);
        expect(body.errors[0].message).toBe("Access token is invalid!");

        [body] = await environmentRead(initial.environment.id).invoke({
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
