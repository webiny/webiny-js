import useContentHandler from "./utils/useContentHandler";
import mocks from "./mocks/accessTokensAuthentication";
import { Database } from "@commodo/fields-storage-nedb";
import {
    createContentModelGroup,
    createEnvironment,
    createAccessToken
} from "@webiny/api-headless-cms/testing";

const LIST_PRODUCTS = /* GraphQL */ `
    query ListProducts {
        listProducts {
            data {
                id
                title
            }
            error {
                message
            }
        }
    }
`;

describe("Access Tokens Authentication Test", () => {
    const database = new Database();
    const { environment: environmentManage } = useContentHandler({ database });
    const { environment: environmentRead } = useContentHandler({ database, type: "read" });

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
            headers: {
                Authorization: "---"
            },
            body: {
                query: LIST_PRODUCTS
            }
        });

        expect(body.errors[0].message).toBe(
            `Not authorized (scope "cms:read:initial-environment:product" not found).`
        );

        [body] = await environmentRead(initial.environment.id).invoke({
            headers: {
                authorization: initial.accessToken.token
            },
            body: {
                query: LIST_PRODUCTS
            }
        });

        expect(body.data.listProducts).toEqual({
            data: [],
            error: null
        });
    });
});
