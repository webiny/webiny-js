// @flow
import { assert } from "chai";

import { i18n } from "./..";

describe("locales set / get test", () => {
    beforeEach(() => i18n.clearTranslations());

    it("should set / get locale correctly", () => {
        assert.isNull(i18n.getLocale());

        i18n.setLocale("en-gb");
        assert.equal(i18n.getLocale(), "en-gb");
    });
});
