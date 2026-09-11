import { describe, it, expect } from "vitest";
import { CodeFlpPath } from "~/features/flp/shared/CodeFlpPath.js";

describe("CodeFlpPath", () => {
    it("should accept both the friendly and the stored path form", () => {
        expect(CodeFlpPath.matches("/marketing", "root/marketing")).toBe(true);
        expect(CodeFlpPath.matches("marketing", "root/marketing")).toBe(true);
        expect(CodeFlpPath.matches("/marketing/", "root/marketing")).toBe(true);
        expect(CodeFlpPath.matches("root/marketing", "root/marketing")).toBe(true);
    });

    it("should not match descendants without a wildcard", () => {
        expect(CodeFlpPath.matches("/marketing", "root/marketing/campaigns")).toBe(false);
    });

    it("should match the folder itself and its descendants with a wildcard", () => {
        expect(CodeFlpPath.matches("/marketing/*", "root/marketing")).toBe(true);
        expect(CodeFlpPath.matches("/marketing/*", "root/marketing/campaigns")).toBe(true);
        expect(CodeFlpPath.matches("/marketing/*", "root/marketing/campaigns/q1")).toBe(true);
    });

    it("should not match a sibling whose name shares a prefix", () => {
        expect(CodeFlpPath.matches("/marketing/*", "root/marketing-archive")).toBe(false);
        expect(CodeFlpPath.matches("/marketing", "root/marketing-archive")).toBe(false);
    });

    it("should treat an empty path as the whole tree", () => {
        expect(CodeFlpPath.matches("/", "root/anything")).toBe(true);
        expect(CodeFlpPath.matches("/*", "root/anything/nested")).toBe(true);
    });

    it("should match the root folder itself", () => {
        expect(CodeFlpPath.matches("root", "root")).toBe(true);
        expect(CodeFlpPath.matches("/*", "root")).toBe(true);
    });
});
