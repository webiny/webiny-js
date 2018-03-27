// @flow
import { assert } from "chai";

import i18n from "./..";

describe("price test", () => {
    it("should output price with no formatting set", () => {
        assert.equal(i18n.price(12), "12.00");
    });

    it("should output price with formatting set", () => {
        i18n.defaultFormats.price.symbol = "$";
        assert.equal(i18n.price(12), "$12.00");
    });

    it("should output price with inline custom formatting set", () => {
        i18n.defaultFormats.price.symbol = "$";
        assert.equal(i18n.price(12, { format: "{amount}{symbol}" }), "12.00$");
    });
});
