// @flow
import { assert } from "chai";

import i18n from "./..";

describe("date test", () => {
    const april1st2018 = new Date(1522540800 * 1000);

    it("should output date with no formatting set", () => {
        assert.equal(i18n.date(april1st2018), "01/04/2018");
    });

    it("should output date with formatting set", () => {
        assert.equal(i18n.date(april1st2018, "YYYY/MM"), "2018/04");
    });

    it("should accept custom string format (and internally convert to Date)", () => {
        assert.equal(i18n.date("2018-04-01", null, "YYYY-MM-DD"), "01/04/2018");
    });
});
