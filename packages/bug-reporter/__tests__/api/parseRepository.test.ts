import { describe, it, expect } from "vitest";
import { parseRepository } from "~/api/parseRepository.js";

describe("parseRepository", () => {
    it("splits an owner/name pair", () => {
        expect(parseRepository("webiny/webiny-js")).toEqual({
            owner: "webiny",
            name: "webiny-js"
        });
    });

    it.each([
        ["webiny"],
        ["webiny/"],
        ["/webiny-js"],
        ["webiny/webiny-js/extra"],
        ["https://github.com/webiny/webiny-js"],
        [""]
    ])("rejects %j rather than letting it 404 at GitHub", repository => {
        expect(() => parseRepository(repository)).toThrow(/not a valid repository/);
    });
});
