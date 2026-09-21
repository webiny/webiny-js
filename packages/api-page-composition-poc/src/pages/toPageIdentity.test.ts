import { describe, expect, it } from "vitest";
import { toPageIdentity } from "./toPageIdentity.js";

describe("toPageIdentity", () => {
    it("maps the site root to /", () => {
        expect(toPageIdentity("https://meridian.io")).toEqual({ path: "/", title: "Home" });
        expect(toPageIdentity("https://meridian.io/")).toEqual({ path: "/", title: "Home" });
    });

    it("derives a path and a title from the last segment", () => {
        expect(toPageIdentity("https://meridian.io/pricing")).toEqual({
            path: "/pricing",
            title: "Pricing"
        });
        expect(toPageIdentity("https://meridian.io/about/our-team")).toEqual({
            path: "/about/our-team",
            title: "Our Team"
        });
    });

    it("treats an index file as addressing its directory", () => {
        expect(toPageIdentity("https://meridian.io/index.html")).toEqual({
            path: "/",
            title: "Home"
        });
        expect(toPageIdentity("https://meridian.io/about/index.html")).toEqual({
            path: "/about",
            title: "About"
        });
    });

    it("drops trailing slashes, page extensions and query strings", () => {
        expect(toPageIdentity("https://meridian.io/pricing/").path).toBe("/pricing");
        expect(toPageIdentity("https://meridian.io/pricing.html").path).toBe("/pricing");
        expect(toPageIdentity("https://meridian.io/pricing?ref=nav").path).toBe("/pricing");
        expect(toPageIdentity("https://meridian.io/pricing#plans").path).toBe("/pricing");
    });

    it("slugifies segments that are not already slugs", () => {
        expect(toPageIdentity("https://meridian.io/Case Studies/Acme Corp")).toEqual({
            path: "/case-studies/acme-corp",
            title: "Acme Corp"
        });
        expect(toPageIdentity("https://meridian.io/blog/%C3%9Cber-uns").path).toBe("/blog/ber-uns");
    });

    it("falls back to treating a non-absolute value as a path", () => {
        expect(toPageIdentity("/pricing")).toEqual({ path: "/pricing", title: "Pricing" });
        expect(toPageIdentity("pricing")).toEqual({ path: "/pricing", title: "Pricing" });
    });
});
