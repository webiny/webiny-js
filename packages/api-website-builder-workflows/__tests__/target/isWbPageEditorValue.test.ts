import { describe, expect, it } from "vitest";
import {
    describeWbPageEditorValue,
    isWbPageEditorValue
} from "~/features/target/isWbPageEditorValue.js";

describe("isWbPageEditorValue", () => {
    it.each([
        ["properties.title", "Home", true],
        ["properties.title", "", false],
        ["properties.title", "   ", false],
        ["properties.title", null, false],
        ["properties.title", 5, false],
        ["properties.seo.title", "S", true],
        ["properties.seo.title", "", true],
        ["properties.seo.title", null, true],
        ["properties.seo.title", 5, false],
        ["properties.seo.description", "D", true],
        ["properties.seo.description", ["D"], false],
        ["properties.seo.canonicalUrl", "/home", true],
        ["properties.seo.canonicalUrl", null, true],
        ["properties.seo.canonicalUrl", false, false],
        ["properties.seo.canonicalUrl", "/ok", true],
        ["properties.seo.canonicalUrl", "https://example.com/home", false],
        ["properties.seo.canonicalUrl", "javascript:alert(1)", false],
        ["properties.seo.canonicalUrl", "//evil.example.com", false],
        ["properties.seo.canonicalUrl", "home", false],
        ["properties.seo.canonicalUrl", "", false],
        ["properties.seo.noIndex", true, true],
        ["properties.seo.noIndex", false, true],
        ["properties.seo.noIndex", null, false],
        ["properties.seo.noIndex", "true", false],
        ["properties.seo.noFollow", true, true],
        ["properties.seo.noFollow", 1, false],
        ["properties.path", "/x", false],
        ["properties.language", "en", false],
        ["elements", {}, false]
    ])("%s accepts %j: %s", (path, value, expected) => {
        expect(isWbPageEditorValue(path, value)).toBe(expected);
    });

    it("rejects undefined everywhere", () => {
        expect(isWbPageEditorValue("properties.title", undefined)).toBe(false);
        expect(isWbPageEditorValue("properties.seo.title", undefined)).toBe(false);
    });

    it("describes what each writable path expects", () => {
        expect(describeWbPageEditorValue("properties.title")).toBe("a non-empty string");
        expect(describeWbPageEditorValue("properties.seo.title")).toBe("a string or null");
        expect(describeWbPageEditorValue("properties.seo.description")).toBe("a string or null");
        expect(describeWbPageEditorValue("properties.seo.canonicalUrl")).toBe(
            "a pathname such as /path, or null"
        );
        expect(describeWbPageEditorValue("properties.seo.noIndex")).toBe("true or false");
        expect(describeWbPageEditorValue("properties.seo.noFollow")).toBe("true or false");
    });
});
