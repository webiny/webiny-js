import { describe, it, expect } from "vitest";
import { CodeFlpTarget } from "~/features/flp/shared/CodeFlpTarget.js";
import type { CodeFolderPermission } from "~/features/flp/shared/abstractions.js";

describe("CodeFlpTarget", () => {
    it("should build a team target from a team slug", () => {
        expect(CodeFlpTarget.resolve({ team: "editors", level: "editor" })).toEqual({
            target: "team:editors",
            level: "editor",
            plugin: true
        });
    });

    it("should build an admin target from a user id", () => {
        expect(CodeFlpTarget.resolve({ user: "abc-123", level: "owner" })).toEqual({
            target: "admin:abc-123",
            level: "owner",
            plugin: true
        });
    });

    it("should mark every resolved permission as code-defined", () => {
        expect(CodeFlpTarget.resolve({ team: "editors", level: "no-access" }).plugin).toBe(true);
    });

    it("should throw when both a team and a user are given", () => {
        const permission = { team: "editors", user: "abc-123", level: "viewer" };

        expect(() => CodeFlpTarget.resolve(permission as CodeFolderPermission)).toThrow(
            /either a team or a user, not both/
        );
    });

    it("should throw when neither a team nor a user is given", () => {
        const permission = { level: "viewer" };

        expect(() => CodeFlpTarget.resolve(permission as CodeFolderPermission)).toThrow(
            /must specify either "team" or "user"/
        );
    });
});
