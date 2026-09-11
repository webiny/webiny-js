import { FlpFactory } from "webiny/api/aco/flp";

/**
 * Code-defined folder-level permissions (FLPs).
 *
 * Works like `MyRole.ts` and `MyTeam.ts`: the rules live in code, are merged into folders when they
 * are read, and cannot be edited in the Admin UI. Nothing is written to the database.
 *
 * Rules are matched on the folder's `type` and `path`:
 * - `type` is the folder type, grouped under `FlpFactory.FolderType` by the app that owns it —
 *   `FileManager.Files`, or `Cms.Entries(modelId)` for a Headless CMS model. Apps that register their
 *   own folders can pass that type as a plain string instead.
 * - `path` is the folder's slug path. The leading `root` segment is optional, so `/marketing` and
 *   `root/marketing` both work. A trailing `/*` matches the folder plus its whole subtree.
 *
 * Each permission targets either a `team` (by slug) or a `user` (by ID). Prefer teams — slugs are
 * authored by hand and stable, while user IDs are generated at runtime and differ per environment.
 *
 * Requires folder-level permissions to be enabled for the project. Without that entitlement these
 * rules are never registered and never enforced.
 */
class MyFolderPermissionsImpl implements FlpFactory.Interface {
    async execute(): FlpFactory.Return {
        return [
            {
                // Everything under /marketing is editable by the content team.
                type: FlpFactory.FolderType.Cms.Entries("article"),
                path: "/marketing/*",
                permissions: [{ team: "content-team", level: "editor" }]
            },
            {
                // The finance folder itself — not its children — is read-only for the same team.
                type: FlpFactory.FolderType.Cms.Entries("article"),
                path: "/finance",
                permissions: [{ team: "content-team", level: "viewer" }]
            },
            {
                // A hard denial. `no-access` always wins: it cannot be overridden by a permission
                // assigned in the Admin UI, and it is inherited by every folder in the subtree.
                // Full-access users are still unaffected, same as with regular FLPs.
                type: FlpFactory.FolderType.Cms.Entries("article"),
                path: "/legal-hold/*",
                permissions: [{ team: "content-team", level: "no-access" }]
            },
            {
                // Folder types are independent — this rule applies to File Manager folders only.
                // `content-team` is the team defined in `MyTeam.ts`; a slug that matches no team is
                // simply never applied, so keep these in sync.
                type: FlpFactory.FolderType.FileManager.Files,
                path: "/brand-assets/*",
                permissions: [{ team: "content-team", level: "viewer" }]
            },
            {
                // A single admin user, by ID. Works, but ties the rule to one environment — reach
                // for a team unless you specifically mean one person.
                type: FlpFactory.FolderType.FileManager.Files,
                path: "/brand-assets/originals/*",
                permissions: [{ user: "6835a2c2b4a1f30008f4d9e1", level: "owner" }]
            }
        ];
    }
}

export default FlpFactory.createImplementation({
    implementation: MyFolderPermissionsImpl,
    dependencies: []
});
