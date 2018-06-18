// @flow
import i18n from "./../src";

describe("number test", () => {
    test("should output number with no formatting set", () => {
        expect(i18n.number(12)).toEqual("12.00");
    });

    test("should output number with formatting set", () => {
        i18n.defaultFormats.number.precision = 3;
        expect(i18n.number(12)).toEqual("12.000");
    });

    test("should output number with inline custom formatting set", () => {
        expect(i18n.number(12, { precision: 4 })).toEqual("12.0000");
    });
});
