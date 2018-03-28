// @flow
import { assert } from "chai";

import i18n from "./..";

describe("all set/get translations related methods test", () => {
    beforeEach(() => i18n.clearTranslations());

    it("should set / get / merge / clear translations correctly", () => {
        i18n.setTranslation("key1", "Key 1 Label");

        assert.equal(i18n.getTranslation("key1"), "Key 1 Label");
        assert.isUndefined(i18n.getTranslation("key 123"));

        assert.deepEqual(i18n.getTranslations(), { key1: "Key 1 Label" });

        i18n.mergeTranslations({
            key1: " Updated Key 1 Label",
            key2: "Key 2 Label",
            key3: "Key 3 Label"
        });

        assert.deepEqual(i18n.getTranslations(), {
            key1: " Updated Key 1 Label",
            key2: "Key 2 Label",
            key3: "Key 3 Label"
        });

        assert.isTrue(i18n.hasTranslation("key1"));
        assert.isTrue(i18n.hasTranslation("key2"));
        assert.isTrue(i18n.hasTranslation("key3"));
        assert.isFalse(i18n.hasTranslation("key4"));

        i18n.clearTranslations();

        assert.deepEqual(i18n.getTranslations(), {});

        assert.isFalse(i18n.hasTranslation("key1"));
        assert.isFalse(i18n.hasTranslation("key2"));
        assert.isFalse(i18n.hasTranslation("key3"));
        assert.isFalse(i18n.hasTranslation("key4"));
    });
});
