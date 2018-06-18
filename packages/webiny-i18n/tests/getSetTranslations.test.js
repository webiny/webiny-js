// @flow
import i18n from "./../src";

describe("all set/get translations related methods test", () => {
    beforeEach(() => i18n.clearTranslations());

    test("should set / get / merge / clear translations correctly", () => {
        i18n.setTranslation("key1", "Key 1 Label");

        expect(i18n.getTranslation("key1")).toEqual("Key 1 Label");
        expect(i18n.getTranslation("key 123")).not.toBeDefined();

        expect(i18n.getTranslations()).toEqual({ key1: "Key 1 Label" });

        i18n.mergeTranslations({
            key1: " Updated Key 1 Label",
            key2: "Key 2 Label",
            key3: "Key 3 Label"
        });

        expect(i18n.getTranslations()).toEqual({
            key1: " Updated Key 1 Label",
            key2: "Key 2 Label",
            key3: "Key 3 Label"
        });

        expect(i18n.hasTranslation("key1")).toBe(true);
        expect(i18n.hasTranslation("key2")).toBe(true);
        expect(i18n.hasTranslation("key3")).toBe(true);
        expect(i18n.hasTranslation("key4")).toBe(false);

        i18n.clearTranslations();

        expect(i18n.getTranslations()).toEqual({});

        expect(i18n.hasTranslation("key1")).toBe(false);
        expect(i18n.hasTranslation("key2")).toBe(false);
        expect(i18n.hasTranslation("key3")).toBe(false);
        expect(i18n.hasTranslation("key4")).toBe(false);
    });
});
