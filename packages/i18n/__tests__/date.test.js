import i18n from "@webiny/i18n";

describe("date test", () => {
    // With below given format (no timezone), Date assumes passed value is in current timezone.
    const april1st2018 = new Date("April 1, 2018 02:00:00");

    test("should output date with no formatting set", () => {
        expect(i18n.date(april1st2018)).toEqual("01/04/2018");
    });

    test("should output date with formatting set", () => {
        expect(i18n.date(april1st2018, "YYYY/MM")).toEqual("2018/04");
    });

    test("should accept custom string format (and internally convert to Date)", () => {
        expect(i18n.date("2018-04-01", null, "YYYY-MM-DD")).toEqual("01/04/2018");
    });
});
