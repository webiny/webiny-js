import { describe, it, expect } from "vitest";
import { createPermissionSchema } from "~/permissions/createPermissionSchema";
import { deserializePermissions, serializePermissions } from "~/permissions/usePermissionForm";
import type { Permission, PermissionSchema } from "~/permissions/types";

/**
 * File Manager schema — typical case with entities.
 */
const fmSchema = createPermissionSchema({
    prefix: "fm",
    fullAccess: { name: "fm.*" },
    entities: [
        {
            id: "file",
            permission: "fm.file",
            scopes: ["full", "own"],
            actions: { rwd: true }
        },
        {
            id: "settings",
            permission: "fm.settings",
            scopes: ["full"]
        }
    ]
});

/**
 * Website Builder schema — simplest case, no entities.
 */
const wbSchema = createPermissionSchema({
    prefix: "wb",
    fullAccess: { name: "wb.*" }
});

/**
 * CMS schema — entities with dependencies and PW.
 */
const cmsSchema = createPermissionSchema({
    prefix: "cms",
    fullAccess: { name: "cms.*" },
    entities: [
        {
            id: "contentModelGroup",
            permission: "cms.contentModelGroup",
            scopes: ["full", "own"],
            actions: { rwd: true }
        },
        {
            id: "contentModel",
            permission: "cms.contentModel",
            scopes: ["full", "own"],
            actions: { rwd: true },
            dependsOn: { entity: "contentModelGroup", requires: "r" }
        },
        {
            id: "contentEntry",
            permission: "cms.contentEntry",
            scopes: ["full", "own"],
            actions: { rwd: true, pw: true },
            dependsOn: { entity: "contentModel", requires: "r" }
        }
    ]
});

describe("deserializePermissions", () => {
    describe("File Manager schema", () => {
        it("should return no access when value is not an array", () => {
            const result = deserializePermissions(fmSchema, null as any);
            expect(result).toEqual({ accessLevel: "no" });
        });

        it("should return no access when no FM permissions exist", () => {
            const result = deserializePermissions(fmSchema, [{ name: "pb.*" }]);
            expect(result).toEqual({ accessLevel: "no" });
        });

        it("should return full access for wildcard", () => {
            const result = deserializePermissions(fmSchema, [{ name: "*" }]);
            expect(result).toEqual({ accessLevel: "full" });
        });

        it("should return full access for fm.*", () => {
            const result = deserializePermissions(fmSchema, [{ name: "fm.*" }]);
            expect(result).toEqual({ accessLevel: "full" });
        });

        it("should deserialize custom access with full scope", () => {
            const result = deserializePermissions(fmSchema, [
                { name: "fm.file", own: false, rwd: "rw" },
                { name: "fm.settings" }
            ]);
            expect(result).toEqual({
                accessLevel: "custom",
                fileAccessScope: "full",
                fileRWD: "rw",
                settingsAccessScope: "full"
            });
        });

        it("should deserialize custom access with own scope", () => {
            const result = deserializePermissions(fmSchema, [
                { name: "fm.file", own: true, rwd: "rwd" }
            ]);
            expect(result).toEqual({
                accessLevel: "custom",
                fileAccessScope: "own",
                fileRWD: "rwd"
            });
        });

        it("should default rwd to 'r' when not provided", () => {
            const result = deserializePermissions(fmSchema, [{ name: "fm.file", own: false }]);
            expect(result).toEqual({
                accessLevel: "custom",
                fileAccessScope: "full",
                fileRWD: "r"
            });
        });
    });

    describe("Website Builder schema", () => {
        it("should return no access for empty array", () => {
            const result = deserializePermissions(wbSchema, []);
            expect(result).toEqual({ accessLevel: "no" });
        });

        it("should return full access for wb.*", () => {
            const result = deserializePermissions(wbSchema, [{ name: "wb.*" }]);
            expect(result).toEqual({ accessLevel: "full" });
        });

        it("should return no access when no wb permissions", () => {
            const result = deserializePermissions(wbSchema, [{ name: "fm.*" }]);
            expect(result).toEqual({ accessLevel: "no" });
        });
    });

    describe("CMS schema", () => {
        it("should deserialize all entities", () => {
            const result = deserializePermissions(cmsSchema, [
                { name: "cms.contentModelGroup", own: false, rwd: "rwd" },
                { name: "cms.contentModel", own: false, rwd: "rw" },
                {
                    name: "cms.contentEntry",
                    own: true,
                    rwd: "rwd",
                    pw: "pu"
                }
            ]);
            expect(result).toEqual({
                accessLevel: "custom",
                contentModelGroupAccessScope: "full",
                contentModelGroupRWD: "rwd",
                contentModelAccessScope: "full",
                contentModelRWD: "rw",
                contentEntryAccessScope: "own",
                contentEntryRWD: "rwd",
                contentEntryPW: ["p", "u"]
            });
        });

        it("should handle pw as empty array when not provided", () => {
            const result = deserializePermissions(cmsSchema, [
                { name: "cms.contentEntry", own: false, rwd: "r" }
            ]);
            expect(result.contentEntryPW).toEqual([]);
        });
    });
});

describe("serializePermissions", () => {
    describe("File Manager schema", () => {
        it("should return filtered permissions for no access", () => {
            const existing: Permission[] = [{ name: "pb.*" }, { name: "fm.file", rwd: "r" }];
            const result = serializePermissions(fmSchema, { accessLevel: "no" }, existing);
            expect(result).toEqual([{ name: "pb.*" }]);
        });

        it("should add fm.* for full access", () => {
            const existing: Permission[] = [{ name: "pb.*" }];
            const result = serializePermissions(fmSchema, { accessLevel: "full" }, existing);
            expect(result).toEqual([{ name: "pb.*" }, { name: "fm.*" }]);
        });

        it("should serialize custom access with full scope", () => {
            const result = serializePermissions(
                fmSchema,
                {
                    accessLevel: "custom",
                    fileAccessScope: "full",
                    fileRWD: "rw",
                    settingsAccessScope: "full"
                },
                []
            );
            expect(result).toEqual([
                { name: "fm.file", own: false, rwd: "rw" },
                { name: "fm.settings", own: false }
            ]);
        });

        it("should serialize custom access with own scope", () => {
            const result = serializePermissions(
                fmSchema,
                {
                    accessLevel: "custom",
                    fileAccessScope: "own",
                    fileRWD: "r" // should be forced to "rwd" for own
                },
                []
            );
            expect(result).toEqual([{ name: "fm.file", own: true, rwd: "rwd" }]);
        });

        it("should skip entities with no scope set", () => {
            const result = serializePermissions(
                fmSchema,
                {
                    accessLevel: "custom",
                    fileAccessScope: "full",
                    fileRWD: "r"
                    // settings not set
                },
                []
            );
            expect(result).toEqual([{ name: "fm.file", own: false, rwd: "r" }]);
        });

        it("should strip existing FM permissions and rebuild", () => {
            const existing: Permission[] = [
                { name: "pb.*" },
                { name: "fm.file", rwd: "rwd", own: true },
                { name: "fm.settings" }
            ];
            const result = serializePermissions(
                fmSchema,
                {
                    accessLevel: "custom",
                    fileAccessScope: "full",
                    fileRWD: "r"
                },
                existing
            );
            expect(result).toEqual([{ name: "pb.*" }, { name: "fm.file", own: false, rwd: "r" }]);
        });
    });

    describe("Website Builder schema", () => {
        it("should emit wb.* for full access", () => {
            const result = serializePermissions(wbSchema, { accessLevel: "full" }, []);
            expect(result).toEqual([{ name: "wb.*" }]);
        });

        it("should emit nothing for no access", () => {
            const result = serializePermissions(wbSchema, { accessLevel: "no" }, []);
            expect(result).toEqual([]);
        });

        it("should emit nothing for custom access with no entities", () => {
            const result = serializePermissions(wbSchema, { accessLevel: "custom" }, []);
            expect(result).toEqual([]);
        });
    });

    describe("CMS schema", () => {
        it("should serialize all entities with dependencies", () => {
            const result = serializePermissions(
                cmsSchema,
                {
                    accessLevel: "custom",
                    contentModelGroupAccessScope: "full",
                    contentModelGroupRWD: "rwd",
                    contentModelAccessScope: "full",
                    contentModelRWD: "rw",
                    contentEntryAccessScope: "full",
                    contentEntryRWD: "rwd",
                    contentEntryPW: ["p", "u"]
                },
                []
            );
            expect(result).toEqual([
                {
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "rwd"
                },
                { name: "cms.contentModel", own: false, rwd: "rw" },
                {
                    name: "cms.contentEntry",
                    own: false,
                    rwd: "rwd",
                    pw: "pu"
                }
            ]);
        });

        it("should prune contentModel when contentModelGroup has no read", () => {
            const result = serializePermissions(
                cmsSchema,
                {
                    accessLevel: "custom",
                    contentModelGroupAccessScope: "full",
                    contentModelGroupRWD: "wd", // no "r"
                    contentModelAccessScope: "full",
                    contentModelRWD: "r",
                    contentEntryAccessScope: "full",
                    contentEntryRWD: "r"
                },
                []
            );
            // contentModel depends on contentModelGroup requiring "r" — pruned
            // contentEntry depends on contentModel — also pruned
            expect(result).toEqual([
                {
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "wd"
                }
            ]);
        });

        it("should prune contentEntry when contentModel is not enabled", () => {
            const result = serializePermissions(
                cmsSchema,
                {
                    accessLevel: "custom",
                    contentModelGroupAccessScope: "full",
                    contentModelGroupRWD: "rwd",
                    // contentModel not set
                    contentEntryAccessScope: "full",
                    contentEntryRWD: "r"
                },
                []
            );
            expect(result).toEqual([
                {
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "rwd"
                }
            ]);
        });

        it("should cascade own scope from parent to child", () => {
            const result = serializePermissions(
                cmsSchema,
                {
                    accessLevel: "custom",
                    contentModelGroupAccessScope: "own",
                    contentModelGroupRWD: "rwd",
                    contentModelAccessScope: "full", // should become "own" due to cascade
                    contentModelRWD: "rw",
                    contentEntryAccessScope: "full", // should become "own" due to cascade
                    contentEntryRWD: "r",
                    contentEntryPW: ["p"]
                },
                []
            );
            expect(result).toEqual([
                {
                    name: "cms.contentModelGroup",
                    own: true,
                    rwd: "rwd"
                },
                {
                    name: "cms.contentModel",
                    own: true,
                    rwd: "rwd"
                },
                {
                    name: "cms.contentEntry",
                    own: true,
                    rwd: "rwd",
                    pw: "p"
                }
            ]);
        });

        it("should handle pw as empty when no PW actions selected", () => {
            const result = serializePermissions(
                cmsSchema,
                {
                    accessLevel: "custom",
                    contentModelGroupAccessScope: "full",
                    contentModelGroupRWD: "rwd",
                    contentModelAccessScope: "full",
                    contentModelRWD: "rwd",
                    contentEntryAccessScope: "full",
                    contentEntryRWD: "r",
                    contentEntryPW: []
                },
                []
            );
            const entry = result.find(p => p.name === "cms.contentEntry");
            expect(entry).toBeDefined();
            expect(entry!.pw).toBeUndefined();
        });
    });

    describe("CMS with custom serialize/deserialize", () => {
        it("should allow custom deserializer to merge extra fields", () => {
            const permissions: Permission[] = [
                { name: "cms.endpoint.manage" },
                { name: "cms.endpoint.read" },
                {
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "rwd",
                    groups: ["group-1"]
                }
            ];

            // Core deserialization
            const coreData = deserializePermissions(cmsSchema, permissions);

            // Custom deserializer merges additional fields
            const customDeserialize = (perms: Permission[]) => ({
                endpoints: perms
                    .filter(p => p.name.startsWith("cms.endpoint."))
                    .map(p => p.name.replace("cms.endpoint.", "")),
                contentModelGroupProps: {
                    groups: perms.find(p => p.name === "cms.contentModelGroup")?.groups
                }
            });

            const merged = { ...coreData, ...customDeserialize(permissions) };
            expect(merged.accessLevel).toBe("custom");
            expect(merged.endpoints).toEqual(["manage", "read"]);
            expect(merged.contentModelGroupProps).toEqual({
                groups: ["group-1"]
            });
        });

        it("should allow custom serializer to add extra permissions", () => {
            const formData = {
                accessLevel: "custom",
                contentModelGroupAccessScope: "full",
                contentModelGroupRWD: "rwd",
                endpoints: ["manage", "read"]
            };

            // Core serialization
            const corePermissions = serializePermissions(cmsSchema, formData, []);

            // Custom serializer adds endpoint permissions
            const customSerialize = (data: Record<string, any>, corePerm: Permission[]) => {
                const extra: Permission[] = [];
                if (data.endpoints) {
                    for (const ep of data.endpoints) {
                        extra.push({ name: `cms.endpoint.${ep}` });
                    }
                }
                return [...corePerm, ...extra];
            };

            const result = customSerialize(
                formData,
                corePermissions.filter(p => p.name.startsWith("cms"))
            );
            expect(result).toEqual([
                {
                    name: "cms.contentModelGroup",
                    own: false,
                    rwd: "rwd"
                },
                { name: "cms.endpoint.manage" },
                { name: "cms.endpoint.read" }
            ]);
        });
    });
});

describe("roundtrip: serialize -> deserialize", () => {
    it("should roundtrip FM full access", () => {
        const original = { accessLevel: "full" };
        const permissions = serializePermissions(fmSchema, original, []);
        const result = deserializePermissions(fmSchema, permissions);
        expect(result).toEqual({ accessLevel: "full" });
    });

    it("should roundtrip FM no access", () => {
        const original = { accessLevel: "no" };
        const permissions = serializePermissions(fmSchema, original, []);
        const result = deserializePermissions(fmSchema, permissions);
        expect(result).toEqual({ accessLevel: "no" });
    });

    it("should roundtrip FM custom access", () => {
        const original = {
            accessLevel: "custom",
            fileAccessScope: "full",
            fileRWD: "rw",
            settingsAccessScope: "full"
        };
        const permissions = serializePermissions(fmSchema, original, []);
        const result = deserializePermissions(fmSchema, permissions);
        expect(result).toEqual(original);
    });

    it("should roundtrip CMS custom access", () => {
        const original = {
            accessLevel: "custom",
            contentModelGroupAccessScope: "full",
            contentModelGroupRWD: "rwd",
            contentModelAccessScope: "own",
            contentModelRWD: "rwd",
            contentEntryAccessScope: "own",
            contentEntryRWD: "rwd",
            contentEntryPW: ["p", "u"]
        };
        const permissions = serializePermissions(cmsSchema, original, []);
        const result = deserializePermissions(cmsSchema, permissions);
        expect(result).toEqual(original);
    });

    it("should roundtrip WB full access", () => {
        const original = { accessLevel: "full" };
        const permissions = serializePermissions(wbSchema, original, []);
        const result = deserializePermissions(wbSchema, permissions);
        expect(result).toEqual({ accessLevel: "full" });
    });
});
