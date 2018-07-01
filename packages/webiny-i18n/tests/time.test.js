import i18n from "webiny-i18n";

describe("time test", () => {
    // With below given format (no timezone), Date assumes passed value is in current timezone.
    const april1st2018 = new Date("April 1, 2018 02:00:00");

    test("should output time with no formatting set", () => {
        expect(i18n.time(april1st2018)).toEqual("02:00");
    });

    test("should output time with formatting set", () => {
        expect(i18n.time(april1st2018, "h:mm")).toEqual("2:00");
    });

    test("should accept custom string format (and internally convert to Date)", () => {
        expect(i18n.time("2018-04-01 01:00:00", null, "YYYY-MM-DD HH:mm:ss")).toEqual("01:00");
    });
});
