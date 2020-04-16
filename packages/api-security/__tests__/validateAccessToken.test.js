import { createHandler } from "@webiny/http-handler";
import accessTokenPlugins from "../src/validateAccessToken";
import { createUtils } from "./utils";

describe("Personal Access Tokens test suite", () => {
    const token = "ddbdaade0646907f8ba90365082ee016eecfe5327bf3341d";

    const { useDatabase, useHandler } = createUtils([accessTokenPlugins()]);
    const db = useDatabase();

    beforeAll(async () => {
        // TODO: Insert user, groups, roles here :D

        await db.getCollection("SecurityPersonalAccessToken").insertOne({
            name: "Test token",
            token,
            user: "" /* userId */
        })
    });

    test("Should validate PAT", async () => {
        const validateAccessTokenHandler = useHandler();
        const event = { PAT: token };
        const context = {};

        const user = await validateAccessTokenHandler(event, context);
        console.log(user);

        // expect(environments).toBe(2);
    });
});
