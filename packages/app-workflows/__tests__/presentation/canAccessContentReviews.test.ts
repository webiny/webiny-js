import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { canAccessContentReviews } from "~/presentation/permissions/canAccessContentReviews.js";
import type { ContentReviewsIdentity } from "~/presentation/permissions/canAccessContentReviews.js";

type Permission = { name: string; rwd?: string; [key: string]: unknown };

/*
 * Matches the way the Admin identity looks permissions up: an exact name, `*`, or a `prefix.*`
 * wildcard.
 */
function matches(granted: string, requested: string): boolean {
    if (granted === "*" || granted === requested) {
        return true;
    }
    if (!granted.endsWith(".*")) {
        return false;
    }
    const prefix = granted.slice(0, -1);
    return requested.startsWith(prefix);
}

const identityWith = (permissions: Permission[], teams: string[] = []): ContentReviewsIdentity => {
    return {
        teams: teams.map(id => ({ id })),
        getPermission: (name: string, exact?: boolean) => {
            const found = permissions.find(item => {
                if (exact) {
                    return item.name === name;
                }
                return matches(item.name, name);
            });
            return found ?? null;
        },
        getPermissions: (name?: string) => {
            if (!name) {
                return permissions;
            }
            return permissions.filter(item => matches(item.name, name));
        }
    };
};

describe("canAccessContentReviews", () => {
    it.each([
        ["full access", [{ name: "*" }], []],
        ["team membership alone", [], ["marketing"]],
        ["workflow management", [{ name: "workflows.*", editor: true }], []],
        ["writing CMS entries", [{ name: "cms.contentEntry", rwd: "rw" }], []],
        ["CMS full access", [{ name: "cms.*" }], []],
        ["writing Website Builder pages", [{ name: "wb.page", rwd: "rwd" }], []]
    ])("shows Content Reviews for %s", (_label, permissions, teams) => {
        const identity = identityWith(permissions, teams);

        expect(canAccessContentReviews(identity)).toBe(true);
    });

    /*
     * The case the preview exposed: a role that only reads content has no review to act on and no
     * way to request one, so the menu and widgets are noise.
     */
    it.each([
        ["read-only CMS entries", [{ name: "cms.contentEntry", rwd: "r" }]],
        ["read-only Website Builder pages", [{ name: "wb.page", rwd: "r" }]],
        ["an unrelated app", [{ name: "fm.file", rwd: "rwd" }]],
        ["nothing at all", []]
    ])("hides Content Reviews for %s", (_label, permissions) => {
        const identity = identityWith(permissions);

        expect(canAccessContentReviews(identity)).toBe(false);
    });
});
