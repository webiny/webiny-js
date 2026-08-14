import { describe, expect, it } from "vitest";
import { scopeClassName } from "./bundleComponent.js";

// The scope class is both the prefix the CSS is scoped to and the class put on the component's wrapper
// element (in three places — this bundler, the admin browser bundler, and the sdk-frontend runtime —
// which must all agree). It must be a single valid CSS identifier, or the styles never apply.
describe("scopeClassName", () => {
    it("slugifies spaces so a multi-word name is one class, not several", () => {
        // The reported bug: "Testimonials with features" produced "rc-testimonials with features".
        expect(scopeClassName("Testimonials with features")).toBe("rc-testimonials-with-features");
    });

    it("collapses slashes and other punctuation to single hyphens", () => {
        expect(scopeClassName("Hero / Banner!")).toBe("rc-hero-banner");
    });

    it("trims leading and trailing separators", () => {
        expect(scopeClassName("  spaced name  ")).toBe("rc-spaced-name");
    });

    it("lowercases", () => {
        expect(scopeClassName("CTA")).toBe("rc-cta");
    });

    it("falls back to a stable slug when the name has no usable characters", () => {
        expect(scopeClassName("   ")).toBe("rc-component");
        expect(scopeClassName("—")).toBe("rc-component");
    });
});
