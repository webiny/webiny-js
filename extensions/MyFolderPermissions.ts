import { FlpFactory } from "webiny/api/aco/flp";

/**
 * Code-defined folder-level permissions (FLPs).
 *
 * Works like `MyRole.ts` and `MyTeam.ts`: the rules live in code, are merged into folders when they
 * are read, and cannot be edited in the Admin UI. Nothing is written to the database.
 *
 * Rules are matched on the folder's `type` and `path`:
 * - `type` is the folder type — `FmFile` for File Manager, `cms:<modelId>` for a Headless CMS model.
 * - `path` is the folder's slug path. The leading `root` segment is optional, so `/marketing` and
 *   `root/marketing` both work. A trailing `/*` matches the folder plus its whole subtree.
 *
 * Prefer `team:` targets over `admin:` ones — team slugs are stable, user IDs are not.
 *
 * Requires folder-level permissions to be enabled for the project. Without that entitlement these
 * rules are never registered and never enforced.
 */
class MyFolderPermissionsImpl implements FlpFactory.Interface {
    async execute(): FlpFactory.Return {
        return [
            {
                // Everything under /marketing is editable by the content team.
                type: "cms:article",
                path: "/marketing/*",
                permissions: [{ target: "team:content-team", level: "editor" }]
            },
            {
                // The finance folder itself — not its children — is read-only for the same team.
                type: "cms:article",
                path: "/finance",
                permissions: [{ target: "team:content-team", level: "viewer" }]
            },
            {
                // A hard denial. `no-access` always wins: it cannot be overridden by a permission
                // assigned in the Admin UI, and it is inherited by every folder in the subtree.
                // Full-access users are still unaffected, same as with regular FLPs.
                type: "cms:article",
                path: "/legal-hold/*",
                permissions: [{ target: "team:content-team", level: "no-access" }]
            },
            {
                // Folder types are independent — this rule applies to File Manager folders only.
                // `content-team` is the team defined in `MyTeam.ts`; a slug that matches no team is
                // simply never applied, so keep these in sync.
                type: "FmFile",
                path: "/brand-assets/*",
                permissions: [{ target: "team:content-team", level: "viewer" }]
            }
        ];
    }
}

export default FlpFactory.createImplementation({
    implementation: MyFolderPermissionsImpl,
    dependencies: []
});
