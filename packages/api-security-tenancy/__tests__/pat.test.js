import useGqlHandler from "./useGqlHandler";
import patAuthentication from "../src/authentication/personalAccessToken";

describe("Security Personal Access Token Test", () => {
    const { install, securityUserPAT } = useGqlHandler();

    const adminData = { firstName: "John", lastName: "Doe", login: "admin@webiny.com" };

    beforeEach(async () => {
        await install.install({
            data: adminData
        });
    });

    test("should create, list, update and delete a PAT", async () => {
        // Create a token
        let [response] = await securityUserPAT.createPAT({ data: { name: "Github Actions" } });

        let data = response.data.security.createPAT.data;

        expect(data).toMatchObject({
            pat: {
                id: expect.any(String),
                name: "Github Actions",
                token: expect.any(String),
                createdOn: expect.any(String)
            },
            token: expect.stringMatching(/p[a-f0-9]{47}/)
        });

        expect(data.pat.token.length).toBe(4);
        expect(data.token.length).toBe(48);

        const token = data.pat;

        // Get own tokens
        [response] = await securityUserPAT.getCurrentUser();

        data = response.data.security.getCurrentUser.data;
        expect(data).toMatchObject({
            login: adminData.login,
            personalAccessTokens: [token]
        });

        // Update token
        [response] = await securityUserPAT.updatePAT({
            id: token.id,
            data: { name: "Renamed token" }
        });

        data = response.data.security.updatePAT.data;
        expect(data).toMatchObject({
            id: expect.any(String),
            name: "Renamed token",
            token: expect.any(String),
            createdOn: expect.any(String)
        });

        // Delete token
        [response] = await securityUserPAT.deletePAT({
            id: token.id
        });

        data = response.data.security.deletePAT.data;
        expect(data).toBe(true);

        // Make sure the token is deleted
        [response] = await securityUserPAT.getCurrentUser();

        data = response.data.security.getCurrentUser.data;
        expect(data.personalAccessTokens.length).toBe(0);
    });

    test("should authenticate a user using PAT sent via headers", async () => {
        const { securityUserPAT } = useGqlHandler({
            plugins: [patAuthentication({ identityType: "admin" })]
        });

        let [response] = await securityUserPAT.createPAT({ data: { name: "Test token" } });
        const { token, pat } = response.data.security.createPAT.data;
        expect(token).toMatch(/p[a-f0-9]{47}/);

        // "getCurrentUser" should return information about the owner of PAT
        [response] = await securityUserPAT.getCurrentUser({}, { Authorization: token });

        const data = response.data.security.getCurrentUser.data;
        expect(data).toMatchObject({
            login: adminData.login,
            personalAccessTokens: [pat]
        });
    });
});
