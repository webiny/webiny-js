import { WebinyError } from "@webiny/error";
import type { CodeFolderPermission } from "./abstractions.js";
import type { FolderPermission } from "~/flp/flp.types.js";

/**
 * Code-defined permissions are authored as `{ team: "editors" }` or `{ user: "<id>" }`. Internally,
 * a permission's target is a single string — `team:editors` or `admin:<id>` — so this is where the
 * authored form is turned into the stored one.
 */
export class CodeFlpTarget {
    static resolve(permission: CodeFolderPermission): FolderPermission {
        const { team, user, level } = permission;

        if (team !== undefined && user !== undefined) {
            throw new WebinyError(
                `A code-defined folder permission must target either a team or a user, not both.`,
                "CODE_FLP_AMBIGUOUS_TARGET",
                { team, user }
            );
        }

        if (team !== undefined) {
            return { target: `team:${team}`, level, plugin: true };
        }

        if (user !== undefined) {
            return { target: `admin:${user}`, level, plugin: true };
        }

        // Without a target we'd silently produce a permission that matches nobody. For a rule that
        // denies access, dropping it quietly would mean accidental exposure — so fail loudly.
        throw new WebinyError(
            `A code-defined folder permission must specify either "team" or "user".`,
            "CODE_FLP_MISSING_TARGET",
            { permission }
        );
    }
}
