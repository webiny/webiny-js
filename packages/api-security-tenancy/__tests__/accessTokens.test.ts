import useGqlHandler from "./useGqlHandler";
// import accessTokenAuthentication from "../src/authentication/accessToken";
// import accessTokenAuthorization from "../src/authorization/accessToken";

describe("Security Access Token Test", () => {
    const { install, securityAccessTokens } = useGqlHandler();

    const adminData = { firstName: "John", lastName: "Doe", login: "admin@webiny.com" };

    beforeEach(async () => {
        await install.install({
            data: adminData
        });
    });

    test("should create, list, update and delete a token", async () => {
        // Create a token
        const [create] = await securityAccessTokens.create({
            data: { name: "Github Actions", description: "Github Actions Token" }
        });

        const { data: token } = create.data.security.createAccessToken;

        expect(token).toMatchObject({
            id: expect.any(String),
            name: "Github Actions",
            token: expect.any(String),
            createdOn: expect.any(String)
        });

        // List tokens
        const [list] = await securityAccessTokens.list();

        const { data: tokensList } = list.data.security.listAccessTokens;
        expect(tokensList).toBeInstanceOf(Array);
        expect(tokensList.length).toBe(1);
        expect(tokensList[0]).toMatchObject({
            id: token.id,
            name: "Github Actions",
            token: token.token
        });

        // Get token
        const [get] = await securityAccessTokens.list();

        const { data: oneToken } = get.data.security.getAccessToken;
        expect(oneToken).toMatchObject({
            id: token.id,
            name: "Github Actions",
            token: token.token
        });

        // Update token
        const [update] = await securityAccessTokens.update({
            id: token.id,
            data: { name: "Renamed token", description: "Updated description" }
        });

        const { data: updatedToken } = update.data.security.updateAccessToken;
        expect(updatedToken).toMatchObject({
            id: token.id,
            name: "Renamed token",
            description: "Updated description",
            token: token.token
        });

        // Delete token
        const [deleted] = await securityAccessTokens.delete({
            id: token.id
        });

        expect(deleted.data.security.deleteAccessToken.data).toBe(true);
    });

    /*test("should authenticate using AT sent via headers", async () => {
        const { securityAccessTokens } = useGqlHandler({
            plugins: [accessTokenAuthentication(), accessTokenAuthorization()]
        });

        let [response] = await securityAccessTokens.createPAT({ data: { name: "Test token" } });
        const { token, pat } = response.data.security.createPAT.data;
        expect(token).toMatch(/p[a-f0-9]{47}/);

        // "getCurrentUser" should return information about the owner of PAT
        [response] = await securityAccessTokens.getCurrentUser({}, { Authorization: token });

        const data = response.data.security.getCurrentUser.data;
        expect(data).toMatchObject({
            login: adminData.login,
            personalAccessTokens: [pat]
        });
    });*/
});
