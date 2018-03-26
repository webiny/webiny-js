// @flow
import { assert } from "chai";

import { i18n } from "./..";

describe("number test", () => {
    it("should output number with no formatting set", () => {
        assert.equal(i18n.number(12), "12.00");
    });

    it("should output number with formatting set", () => {
        i18n.defaultFormats.number.precision = 3;
        assert.equal(i18n.number(12), "12.000");
    });

    it("should output number with inline custom formatting set", () => {
        assert.equal(i18n.number(12, { precision: 4 }), "12.0000");
    });
});
