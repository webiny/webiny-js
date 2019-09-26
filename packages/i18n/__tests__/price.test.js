import i18n from "@webiny/i18n";

describe("price test", () => {
    test("should output price with no formatting set", () => {
        expect(i18n.price(12)).toEqual("12.00");
    });

    test("should output price with formatting set", () => {
        i18n.defaultFormats.price.symbol = "$";
        expect(i18n.price(12)).toEqual("$12.00");
    });

    test("should output price with inline custom formatting set", () => {
        i18n.defaultFormats.price.symbol = "$";
        expect(i18n.price(12, { format: "{amount}{symbol}" })).toEqual("12.00$");
    });
});
