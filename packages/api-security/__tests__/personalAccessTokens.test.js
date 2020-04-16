import accessTokenPlugins from "../src/validateAccessToken";
import { createHandler } from "@webiny/http-handler";

describe("Personal Access Tokens test suite", () => {
    // beforeAll -> insert TOKEN into db...

    it("Should validate PAT", async () => {
        const token = "ddbdaade0646907f8ba90365082ee016eecfe5327bf3341d";

        const validateAccessTokenHandler = createHandler(accessTokenPlugins());
        const event = { PATzzx: token };
        const context = {};

        const user = await validateAccessTokenHandler(event, context);
        console.log(user);

        // expect(environments).toBe(2);
    });
});
