import i18n from "webiny-i18n";

describe("datetime test", () => {
    // With below given format (no timezone), Date assumes passed value is in current timezone.
    const april1st2018 = new Date("April 1, 2018 02:00:00");

    test("should output datetime with no formatting set", () => {
        expect(i18n.dateTime(april1st2018)).toEqual("01/04/2018 02:00");
    });

    test("should output datetime with formatting set", () => {
        expect(i18n.dateTime(april1st2018, "h:mm YY/MM")).toEqual("2:00 18/04");
    });

    test("should accept custom string format (and internally convert to Date)", () => {
        expect(i18n.dateTime("2018-04-01 01:00:00", null, "YYYY-MM-DD HH:mm:ss")).toEqual(
            "01/04/2018 01:00"
        );
    });
});
