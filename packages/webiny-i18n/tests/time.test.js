// @flow
import { assert } from "chai";

import i18n from "./..";

describe("time test", () => {
    // With below given format (no timezone), Date assumes passed value is in current timezone.
    const april1st2018 = new Date("April 1, 2018 02:00:00");

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
