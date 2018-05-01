// @flow
import { assert } from "chai";

import i18n from "./..";

describe("datetime test", () => {
    // With below given format (no timezone), Date assumes passed value is in current timezone.
    const april1st2018 = new Date("April 1, 2018 02:00:00");

    it("should output datetime with no formatting set", () => {
        assert.equal(i18n.dateTime(april1st2018), "01/04/2018 02:00");
    });

    it("should output datetime with formatting set", () => {
        assert.equal(i18n.dateTime(april1st2018, "h:mm YY/MM"), "2:00 18/04");
    });

    it("should accept custom string format (and internally convert to Date)", () => {
        assert.equal(
            i18n.dateTime("2018-04-01 01:00:00", null, "YYYY-MM-DD HH:mm:ss"),
            "01/04/2018 01:00"
        );
    });
});
