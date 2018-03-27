// @flow
import { assert } from "chai";

import i18n from "./..";

describe("datetime test", () => {
    const april1st2018 = new Date(1522540800 * 1000);

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
