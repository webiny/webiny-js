// @flow
import { assert } from "chai";

import { i18n } from "./..";

describe("time test", () => {
    const april1st2018 = new Date(1522540800 * 1000);

    it("should output time with no formatting set", () => {
        assert.equal(i18n.time(april1st2018), "02:00");
    });

    it("should output time with formatting set", () => {
        assert.equal(i18n.time(april1st2018, "h:mm"), "2:00");
    });

    it("should accept custom string format (and internally convert to Date)", () => {
        assert.equal(i18n.time("2018-04-01 01:00:00", null, "YYYY-MM-DD HH:mm:ss"), "01:00");
    });
});
