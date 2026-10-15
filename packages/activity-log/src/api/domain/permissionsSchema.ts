import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

/**
 * Two permissions, both global capabilities.
 *
 * Neither is scoped per model, because model scoping already exists:
 * `AccessControl.canAccessEntry({ model })` consults `cms.contentModel` and `cms.contentEntry`, so
 * an entry whose model a reader cannot read has no reachable timeline. A per-model activity
 * permission would be a second place to express "which models may this person see", and the two
 * would drift.
 *
 * Named `activityLog.*` rather than under a `cms.` prefix because the package is target-agnostic;
 * a CMS-prefixed permission would need renaming the moment Website Builder targets are recorded.
 *
 * Deliberately not under `advancedAccessControlLayer` and deliberately unrelated to
 * `canUseAuditLogs`. Either would tie the timeline to an enterprise-only entitlement, which the
 * brief rules out. Tier is an entitlement question, not a permission one.
 */
export const ACTIVITY_LOG_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "activityLog",
    fullAccess: true,
    entities: [
        {
            id: "timeline",
            title: "Activity timeline",
            permission: "activityLog.timeline",
            scopes: ["full"],
            description:
                "Read the activity timeline of an entry: what changed, when, and which fields. " +
                "Entry read access is still required, so this grants nothing for entries the " +
                "role cannot already read."
        },
        {
            id: "actor",
            title: "Activity actor identity",
            permission: "activityLog.actor",
            scopes: ["full"],
            /**
             * The limit stated here is the honest scope, and it is stated *here* rather than only
             * in the design document because this is the text someone reads while granting the
             * permission — see the note below on the revision join.
             */
            description:
                "See who performed each action, and filter the timeline by person. Does not " +
                "hide the last person to save a revision: that name is already shown on the " +
                "entry itself, and can be matched to a timeline record. It does hide who " +
                "approved, rejected, took over, trashed, restored or moved an entry, and who " +
                "triggered activity performed by a background task."
        }
    ]
});

/**
 * ## Why `activityLog.actor` does not protect the final saver of a revision
 *
 * A record carries the revision it landed on. The entry itself carries `revisionSavedBy`, which
 * names the last person to save that revision, and a reader who can see the timeline can read the
 * entry by definition. So a record's revision can be matched to that name.
 *
 * Accepted, for three reasons:
 *
 *   1. **Removing the revision would not close it.** A reader could still match a record's
 *      timestamp against each revision's `savedOn`. It would break timeline grouping and the
 *      revision filter and buy nothing, so it is not a trade-off — only worse.
 *   2. **The leak is partial, not exact.** `revisionSavedBy` names the *last* saver of a revision,
 *      and this feature exists precisely because a revision holds many saves by several people
 *      over days. The join recovers one name per revision and says nothing about the saves before
 *      it.
 *   3. **The name is already visible.** Anyone who can read the entry can read it. The permission
 *      is not failing to protect something; it is declining to hide something the platform already
 *      shows elsewhere.
 *
 * What it does protect is the set people actually ask about: who approved this, who took the
 * review over, who moved it, who put it in the bin.
 */
