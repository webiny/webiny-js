interface Permission {
    name: string;
    rwd?: unknown;
}

/*
 * The parts of the Admin identity this rule reads. Structural, so the rule can be tested with plain
 * objects and doesn't depend on the identity class.
 */
export interface ContentReviewsIdentity {
    teams: ReadonlyArray<{ id: string }>;
    getPermission(name: string, exact?: boolean): unknown;
    getPermissions(name?: string): Permission[];
}

function canWrite(permissions: Permission[]): boolean {
    return permissions.some(permission => {
        // No rwd means the permission grants everything it covers, e.g. `cms.*` or `*`.
        if (typeof permission.rwd !== "string") {
            return true;
        }
        return permission.rwd.includes("w");
    });
}

function managesWorkflows(permissions: Permission[]): boolean {
    return permissions.some(permission => {
        return permission.name === "workflows" || permission.name.startsWith("workflows.");
    });
}

/**
 * Whether Content Reviews (the menu item, its route and both dashboard widgets) has anything to
 * offer this identity. Each condition mirrors what the API does:
 *
 * - A team member can be a reviewer. Workflow steps are assigned to teams, and the API offers
 *   reviews only to members of those teams.
 * - Anyone who can write CMS entries or Website Builder pages can request a review, and follows
 *   their own requests from here.
 * - Whoever manages workflows gets the overview.
 *
 * Deliberately generous. A false "yes" shows an empty list; a false "no" would hide a review
 * someone has to act on.
 */
export function canAccessContentReviews(identity: ContentReviewsIdentity): boolean {
    if (identity.getPermission("*", true)) {
        return true;
    }

    if (identity.teams.length > 0) {
        return true;
    }

    const allPermissions = identity.getPermissions();
    if (managesWorkflows(allPermissions)) {
        return true;
    }

    const entryPermissions = identity.getPermissions("cms.contentEntry");
    if (canWrite(entryPermissions)) {
        return true;
    }

    const pagePermissions = identity.getPermissions("wb.page");
    return canWrite(pagePermissions);
}
