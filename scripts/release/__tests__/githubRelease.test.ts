import { describe, it, expect } from "vitest";
import { GithubRelease } from "../src/GithubRelease";

describe("GithubRelease.from", () => {
    it('should preserve "latest" string', () => {
        const gr = GithubRelease.from("latest");
        expect(gr.isLatest()).toBe(true);
        expect(gr.isEnabled()).toBe(true);
        expect(gr.toValue()).toBe("latest");
    });

    it("should preserve boolean true", () => {
        const gr = GithubRelease.from(true);
        expect(gr.isEnabled()).toBe(true);
        expect(gr.isLatest()).toBe(false);
        expect(gr.toValue()).toBe(true);
    });

    it("should preserve boolean false", () => {
        const gr = GithubRelease.from(false);
        expect(gr.isEnabled()).toBe(false);
        expect(gr.isLatest()).toBe(false);
        expect(gr.toValue()).toBe(false);
    });

    it('should parse "true" string to boolean true', () => {
        const gr = GithubRelease.from("true");
        expect(gr.isEnabled()).toBe(true);
        expect(gr.toValue()).toBe(true);
    });

    it('should parse "false" string to boolean false', () => {
        const gr = GithubRelease.from("false");
        expect(gr.isEnabled()).toBe(false);
        expect(gr.toValue()).toBe(false);
    });

    it("should treat undefined as false", () => {
        const gr = GithubRelease.from(undefined);
        expect(gr.isEnabled()).toBe(false);
    });

    it("should treat random strings as false", () => {
        const gr = GithubRelease.from("something");
        expect(gr.isEnabled()).toBe(false);
    });
});
