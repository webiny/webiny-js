// @flow
import i18n from "./../src";

describe("locales set / get test", () => {
    beforeEach(() => i18n.clearTranslations());

    test("should set / get locale correctly", () => {
        expect(i18n.getLocale()).toBeNull();

        i18n.setLocale("en-gb");
        expect(i18n.getLocale()).toEqual("en-gb");
    });
});
