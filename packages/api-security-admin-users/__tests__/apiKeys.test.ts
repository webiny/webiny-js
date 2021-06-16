import useGqlHandler from "./useGqlHandler";
import apiKeyAuthentication from "../src/authentication/apiKey";
import apiKeyAuthorization from "../src/authorization/apiKey";

describe("Security Access Token Test", () => {
    const { install, securityApiKeys } = useGqlHandler();

    const adminData = { firstName: "John", lastName: "Doe", login: "admin@webiny.com" };

    beforeEach(async () => {
        await install.install({
            data: adminData
        });
    });

    test("should create, list, update and delete a token", async () => {
        // Create a token
        const [create] = await securityApiKeys.create({
            data: { name: "Github Actions", description: "Github Actions Token", permissions: [] }
        });

        const { data: token } = create.data.security.createApiKey;

        expect(token).toMatchObject({
            id: expect.any(String),
            name: "Github Actions",
            description: "Github Actions Token",
            token: expect.any(String),
            createdOn: expect.any(String)
        });

        // List tokens
        const [list] = await securityApiKeys.list();

        const { data: tokensList } = list.data.security.listApiKeys;
        expect(tokensList).toBeInstanceOf(Array);
        expect(tokensList.length).toBe(1);
        expect(tokensList[0]).toMatchObject({
            id: token.id,
            name: "Github Actions",
            token: token.token
        });

        // Get token
        const [get] = await securityApiKeys.get({ id: token.id });

        const { data: oneToken } = get.data.security.getApiKey;
        expect(oneToken).toMatchObject({
            id: token.id,
            name: "Github Actions",
            token: token.token
        });

        // Update token
        const [update] = await securityApiKeys.update({
            id: token.id,
            data: { name: "Renamed token", description: "Updated description", permissions: [] }
        });

        const { data: updatedToken } = update.data.security.updateApiKey;
        expect(updatedToken).toMatchObject({
            id: token.id,
            name: "Renamed token",
            description: "Updated description",
            token: token.token
        });

        // Delete token
        const [deleted] = await securityApiKeys.delete({
            id: token.id
        });

        expect(deleted.data.security.deleteApiKey.data).toBe(true);
    });

    test("should authenticate using API key sent via headers", async () => {
        const { securityApiKeys, securityUser } = useGqlHandler({
            plugins: [apiKeyAuthentication(), apiKeyAuthorization()]
        });

        const [create] = await securityApiKeys.create({
            data: {
                name: "API Key",
                description: "API key description",
                permissions: [{ name: "security.user" }]
            }
        });

        const { data: apiKey } = create.data.security.createApiKey;
        expect(apiKey.token).toMatch(/a[a-f0-9]{47}/);

        // Should throw Not Authorized error
        const [listError] = await securityUser.list({}, { Authorization: "123" });
        expect(listError.data.security.listUsers.data).toBe(null);
        expect(listError.data.security.listUsers.error.code).toBe("SECURITY_NOT_AUTHORIZED");

        // "listUsers" should return an array of users
        const [list] = await securityUser.list({}, { Authorization: apiKey.token });

        const users = list.data.security.listUsers;
        expect(users).toMatchObject({
            data: [
                {
                    firstName: "John",
                    lastName: "Doe",
                    login: "admin@webiny.com",
                    group: {
                        slug: "full-access"
                    }
                }
            ]
        });
    });
});
