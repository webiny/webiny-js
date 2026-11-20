import { describe, expect, it } from "vitest";
import { useGqlHandler } from "~tests/useGqlHandler.js";

const GET_USER = /* GraphQL */ `
    query GetUser($where: AdminUsersGetUserWhereInput) {
        adminUsers {
            getUser(where: $where) {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const GET_CURRENT_USER = /* GraphQL */ `
    query GetCurrentUser {
        adminUsers {
            getCurrentUser {
                data {
                    id
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

// The test authenticator treats a request with the `authorization` header as anonymous.
const anonymous = { authorization: "" };

describe("Users GraphQL", () => {
    const { invoke } = useGqlHandler();

    it("should not crash when getting a user without the `where` argument", async () => {
        const [response] = await invoke({ body: { query: GET_USER } });

        expect(response.errors).toBeUndefined();
        expect(response.data.adminUsers.getUser).toEqual({
            data: null,
            error: {
                code: "NOT_FOUND",
                message: expect.any(String)
            }
        });
    });

    it("should not authorize an anonymous caller getting a user without the `where` argument", async () => {
        const [response] = await invoke({ body: { query: GET_USER }, headers: anonymous });

        expect(response.errors).toBeUndefined();
        expect(response.data.adminUsers.getUser).toEqual({
            data: null,
            error: {
                code: "AdminUser/NotAuthorized",
                message: "Not authorized!"
            }
        });
    });

    it("should not authorize an anonymous caller getting the current user", async () => {
        const [response] = await invoke({ body: { query: GET_CURRENT_USER }, headers: anonymous });

        expect(response.errors).toBeUndefined();
        expect(response.data.adminUsers.getCurrentUser).toEqual({
            data: null,
            error: {
                code: "AdminUser/NotAuthorized",
                message: "Not authorized!"
            }
        });
    });
});
