import accessTokenPlugins from "../src/validateAccessToken";
import { createUtils } from "./utils";

describe("Personal Access Tokens test suite", () => {
    const { useDatabase, useHandler } = createUtils([accessTokenPlugins()]);
    const db = useDatabase();

    const userData = {
        id: "5e98759a22b42a9a6e5ccee8",
        email: "test@test660138218214.test"
    };
    const token = "ewighoewhosdahgioshgioshiogs";

    beforeAll(async () => {
        await db.getCollection("SecurityUser").insertOne(userData);
        await db.getCollection("SecurityPersonalAccessToken").insertOne({
            id: "5e987593df7ee5f6287074c5",
            name: "Awesome test token",
            token,
            user: userData.id
        });
    });

    afterAll(async () => {});

    test("Should validate PAT", async () => {
        const validateAccessTokenHandler = useHandler();
        const event = { PAT: token };
        const context = {};

        const user = await validateAccessTokenHandler(event, context);
        expect(user).toBeTruthy();
        expect(user.id).toBe(userData.id);
        expect(user.type).toBe("user");
        expect(user.access).toEqual({ scopes: [], roles: [], fullAccess: false });
    });
});
