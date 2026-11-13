import { minimatch } from "minimatch";
import type { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { SecurityPermission } from "~/types/security.js";

/**
 * Security: the "cannot grant more than you hold" rule.
 *
 * A caller may only write (into a role, or onto a user through roles and teams) permissions they
 * themselves hold. The check is conservative: when two permissions can't be compared safely, the
 * requested one must match the held one exactly.
 *
 * A requested permission is covered by a held permission when:
 * - the held name equals the requested name, or is a pattern that matches it (`cms.*`, `*`);
 *   a requested name that is itself a pattern (anything beyond a trailing `.*`) must be held verbatim;
 * - `rwd` / `pw`: the held letters are a superset of the requested ones. A missing `rwd` means
 *   full access (Headless CMS), so it is only covered by a held permission without `rwd`;
 *   a missing or empty `pw` grants nothing;
 * - `own`: a held `own: true` only covers a requested `own: true`;
 * - `models` / `groups`: a held list only covers a requested list that is a subset of it;
 *   a missing held list means "no restriction";
 * - any other property must be equal (deep) on both sides, including being absent on both.
 *
 * A held wildcard permission with nothing but a name (e.g. `{ name: "cms.*" }`) is full access to
 * everything it matches.
 *
 * Headless CMS links its group, model and entry permissions through `_src`, which is set to the
 * role a permission comes from when it is loaded. So all `cms.` permissions of one requested
 * role must be covered by the `cms.` permissions of a single held `_src` (one of the caller's
 * roles), and only the first held permission of each name in it counts (that is the one the CMS
 * uses). Other permissions are checked one by one against everything the caller holds.
 */

export const CANNOT_GRANT_PERMISSIONS_MESSAGE =
    "Not authorized! You can only grant permissions you have yourself.";

/**
 * One group of requested permissions that end up together at runtime, i.e. one role.
 */
export type RequestedPermissions = SecurityPermission[];

const LINKED_PREFIXES = ["cms."];

const LETTER_KEYS = ["rwd", "pw"];
const LIST_KEYS = ["models", "groups"];
const IGNORED_KEYS = ["name", "_src"];

// A plain name (`security.role`) optionally ending with `.*`, or a bare `*`.
const SIMPLE_NAME = /^(\*|[A-Za-z0-9_\-:]+(\.[A-Za-z0-9_\-:]+)*(\.\*)?)$/;

const isLinked = (permission: SecurityPermission) => {
    return LINKED_PREFIXES.some(prefix => String(permission.name).startsWith(prefix));
};

const isPattern = (name: string) => name.includes("*");

const isAbsent = (value: unknown) => value === undefined || value === null;

const isPureWildcard = (permission: SecurityPermission) => {
    if (!isPattern(permission.name)) {
        return false;
    }
    return Object.keys(permission).every(
        key => IGNORED_KEYS.includes(key) || isAbsent(permission[key])
    );
};

const deepEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) {
        return true;
    }
    if (isAbsent(a) && isAbsent(b)) {
        return true;
    }
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
        return false;
    }
    if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
        if (!deepEqual((a as any)[key], (b as any)[key])) {
            return false;
        }
    }
    return true;
};

const nameCovers = (heldName: string, requestedName: string): boolean => {
    if (typeof heldName !== "string" || typeof requestedName !== "string") {
        return false;
    }
    if (heldName === requestedName) {
        return true;
    }
    if (heldName === "*") {
        return true;
    }
    if (!SIMPLE_NAME.test(requestedName)) {
        // A requested pattern we can't reason about must be held verbatim.
        return false;
    }
    if (!isPattern(heldName)) {
        return false;
    }
    return minimatch(requestedName, heldName);
};

const lettersCover = (held: unknown, requested: unknown): boolean => {
    if (typeof held !== "string" || typeof requested !== "string") {
        return false;
    }
    return requested.split("").every(letter => held.includes(letter));
};

const keyCovers = (key: string, held: unknown, requested: unknown): boolean => {
    if (key === "rwd") {
        if (isAbsent(requested)) {
            // A missing `rwd` means full access.
            return isAbsent(held);
        }
        return lettersCover(held, requested);
    }

    if (key === "pw") {
        if (isAbsent(requested) || requested === "") {
            return true;
        }
        return lettersCover(held, requested);
    }

    if (key === "own") {
        if (held === true) {
            return requested === true;
        }
        if (isAbsent(held) || held === false) {
            return isAbsent(requested) || typeof requested === "boolean";
        }
        return deepEqual(held, requested);
    }

    if (LIST_KEYS.includes(key)) {
        if (isAbsent(held)) {
            return true;
        }
        if (Array.isArray(held) && Array.isArray(requested)) {
            return requested.every(item => held.some(heldItem => deepEqual(heldItem, item)));
        }
        return deepEqual(held, requested);
    }

    return deepEqual(held, requested);
};

/**
 * Whether one held permission covers one requested permission.
 */
export const permissionCovers = (
    held: SecurityPermission,
    requested: SecurityPermission
): boolean => {
    if (!nameCovers(held.name, requested.name)) {
        return false;
    }

    if (isPureWildcard(held)) {
        return true;
    }

    const keys = new Set([...Object.keys(held), ...Object.keys(requested), ...LETTER_KEYS]);
    for (const key of keys) {
        if (IGNORED_KEYS.includes(key)) {
            continue;
        }
        if (!keyCovers(key, held[key], requested[key])) {
            return false;
        }
    }

    return true;
};

const groupBySrc = (permissions: SecurityPermission[]) => {
    const groups = new Map<unknown, SecurityPermission[]>();
    for (const permission of permissions) {
        const key = permission._src;
        const group = groups.get(key) ?? [];
        // Only the first permission of each name in a linked group is used by the CMS.
        if (!group.some(p => p.name === permission.name)) {
            group.push(permission);
        }
        groups.set(key, group);
    }
    return Array.from(groups.values());
};

/**
 * Returns the requested permissions the holder of `held` permissions may not grant.
 * An empty array means everything may be granted.
 */
export const findUngrantablePermissions = (
    held: SecurityPermission[],
    requested: RequestedPermissions[]
): SecurityPermission[] => {
    if (held.some(permission => permission.name === "*")) {
        return [];
    }

    const pureWildcards = held.filter(isPureWildcard);
    const coveredByWildcard = (permission: SecurityPermission) => {
        return pureWildcards.some(wildcard => nameCovers(wildcard.name, permission.name));
    };

    const heldLinkedGroups = groupBySrc(held.filter(isLinked));

    const ungrantable: SecurityPermission[] = [];

    for (const group of requested) {
        const permissions = (group ?? []).filter(Boolean);

        // Independent permissions: any held permission may cover them.
        for (const permission of permissions.filter(p => !isLinked(p))) {
            if (coveredByWildcard(permission)) {
                continue;
            }
            if (!held.some(h => permissionCovers(h, permission))) {
                ungrantable.push(permission);
            }
        }

        // Linked permissions: one held group must cover all of them.
        const linked = permissions.filter(p => isLinked(p) && !coveredByWildcard(p));
        if (linked.length === 0) {
            continue;
        }

        const covered = heldLinkedGroups.some(heldGroup => {
            return linked.every(permission => heldGroup.some(h => permissionCovers(h, permission)));
        });

        if (!covered) {
            ungrantable.push(...linked);
        }
    }

    return ungrantable;
};

/**
 * Whether the current identity may grant everything in `requested`. Code running without
 * authorization (installers, migrations) and full access may grant anything.
 */
export const canGrantPermissions = async (
    identityContext: IdentityContext.Interface,
    requested: RequestedPermissions[]
): Promise<boolean> => {
    if (!identityContext.isAuthorizationEnabled()) {
        return true;
    }

    const held = await identityContext.listPermissions();
    return findUngrantablePermissions(held, requested).length === 0;
};

/**
 * Whether the current identity has full access. Code running without authorization
 * (installers, migrations) counts as full access.
 */
export const hasFullAccessOrNoAuthorization = async (
    identityContext: IdentityContext.Interface
): Promise<boolean> => {
    if (!identityContext.isAuthorizationEnabled()) {
        return true;
    }
    return identityContext.hasFullAccess();
};
