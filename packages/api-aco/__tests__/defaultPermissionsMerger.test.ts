import { describe, it, expect } from "vitest";
import { createIdentity } from "./utils/identity";
import { SecurityPermission } from "@webiny/api-security/types";
import { FolderPermission } from "~/flp/flp.types";
import { DefaultPermissionsMerger } from "~/features/flp/FolderLevelPermissions/useCases/GetDefaultPermissions/DefaultPermissionsMerger.js";

const identity1 = createIdentity({ id: "1", type: "admin", displayName: "Identity 1" });

const merge = (
    folderPermissions: FolderPermission[],
    userPermissions: SecurityPermission[] = []
) => {
    return DefaultPermissionsMerger.merge(identity1, userPermissions, folderPermissions);
};

const expectMergeToEqual = (permissions: FolderPermission[], result: FolderPermission[]) => {
    const merged = merge(permissions);
    expect(merged).toEqual(result);
};

describe("DefaultPermissionsMerger", () => {
    it("when comparing different permissions, the most permissive one wins", async () => {
        // This is just a basic test that ensures the following: no-access > owner > editor > viewer.
        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access" },
                { target: "admin:1", level: "viewer" },
                { target: "admin:1", level: "editor" }
            ],
            [{ level: "no-access", target: "admin:1" }]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access" },
                { target: "admin:1", level: "viewer" },
                { target: "admin:1", level: "editor" },
                { target: "admin:1", level: "owner" }
            ],
            [{ level: "no-access", target: "admin:1" }]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "viewer" },
                { target: "admin:1", level: "editor" }
            ],
            [{ level: "editor", target: "admin:1" }]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "editor" },
                { target: "admin:1", level: "owner" }
            ],
            [{ level: "owner", target: "admin:1" }]
        );
    });

    it("no-access permission cannot be overridden", async () => {
        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access" },
                { target: "admin:1", level: "viewer" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "owner", target: "admin:2" },
                { level: "no-access", target: "admin:1" }
            ]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access" },
                { target: "admin:1", level: "editor" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "owner", target: "admin:2" },
                { level: "no-access", target: "admin:1" }
            ]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access" },
                { target: "admin:1", level: "owner" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "owner", target: "admin:2" },
                { level: "no-access", target: "admin:1" }
            ]
        );

        // parent-inherited `no-access` permission also cannot be overridden.
        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access", inheritedFrom: "parent:xyz" },
                { target: "admin:1", level: "viewer" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "owner", target: "admin:2" },
                { level: "no-access", target: "admin:1", inheritedFrom: "parent:xyz" }
            ]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "no-access", inheritedFrom: "parent:xyz" },
                { target: "admin:1", level: "owner" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "owner", target: "admin:2" },
                { level: "no-access", target: "admin:1", inheritedFrom: "parent:xyz" }
            ]
        );
    });

    it("permissions inherited from parent can be overridden by new permissions", async () => {
        expectMergeToEqual(
            [
                { target: "admin:1", level: "editor", inheritedFrom: "parent:xyz" },
                { target: "admin:1", level: "viewer" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "viewer", target: "admin:1" },
                { level: "owner", target: "admin:2" }
            ]
        );

        expectMergeToEqual(
            [
                { target: "admin:1", level: "viewer", inheritedFrom: "parent:xyz" },
                { target: "admin:1", level: "editor" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "editor", target: "admin:1" },
                { level: "owner", target: "admin:2" }
            ]
        );
    });

    it("parent-inherited `owner` permission can be overridden", async () => {
        expectMergeToEqual(
            [
                { target: "admin:1", level: "owner", inheritedFrom: "parent:xyz" },
                { target: "admin:1", level: "no-access" },
                { target: "admin:2", level: "owner" }
            ],
            [
                { level: "owner", target: "admin:2" },
                { level: "no-access", target: "admin:1" }
            ]
        );
    });

    it("if a u user has `full-access` permission, then they're an `owner` of all folders", async () => {
        const result = merge(
            [
                { target: "admin:1", level: "no-access" },
                { target: "admin:1", level: "viewer" },
                { target: "admin:2", level: "owner" }
            ],
            [{ name: "*" }]
        );

        expect(result).toEqual([
            {
                inheritedFrom: "role:full-access",
                level: "owner",
                target: "admin:1"
            },
            { level: "owner", target: "admin:2" }
        ]);
    });
});
