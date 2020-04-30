import accessTokenLambdaPlugins from "../src/validateAccessToken";
import { createUtils } from "./utils";
import { mockedUser, mockedToken } from "./mocks";

describe("Personal Access Tokens [Lambda Handler] test suite", () => {
    const { useDatabase, useHandler } = createUtils([accessTokenLambdaPlugins()]);
    const db = useDatabase();

    beforeAll(async () => {
        await db.getCollection("SecurityUser").insertOne(mockedUser);
        await db.getCollection("SecurityPersonalAccessToken").insertOne({
            ...mockedToken,
            user: mockedUser.id
        });
    });

    test("Should validate PAT", async () => {
        const validateAccessTokenHandler = useHandler();
        const event = { PAT: mockedToken.token };
        const context = {};

        const user = await validateAccessTokenHandler(event, context);
        expect(user).toBeTruthy();
        expect(user.id).toBe(mockedUser.id);
        expect(user.type).toBe("user");
        expect(user.access).toEqual({ scopes: [], roles: [], fullAccess: false });
    });
});
