import { describe, expect, it } from "vitest";
import { escapeHtml } from "~/features/notifications/shared/escapeHtml.js";

describe("escapeHtml (R193)", () => {
    it("escapes ampersand, angle brackets and both quotes", () => {
        expect(escapeHtml(`a & b < c > d " e ' f`)).toBe(
            "a &amp; b &lt; c &gt; d &quot; e &#39; f"
        );
    });

    it("escapes the ampersand first, so an entity is not left half-escaped", () => {
        expect(escapeHtml("&lt;script&gt;")).toBe("&amp;lt;script&amp;gt;");
    });

    it("neutralises a script tag", () => {
        expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
            "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
        );
    });

    it("keeps newlines and plain text as they are", () => {
        expect(escapeHtml("one\ntwo")).toBe("one\ntwo");
        expect(escapeHtml("")).toBe("");
    });
});
