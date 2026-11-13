import { describe, expect, it } from "vitest";
import {
    canGrantPermissions,
    findUngrantablePermissions,
    hasFullAccessOrNoAuthorization,
    permissionCovers
} from "~/features/security/utils/canGrantPermissions.js";
import type { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { SecurityPermission } from "~/types/security.js";

const canGrant = (held: SecurityPermission[], requested: SecurityPermission[]) => {
    return findUngrantablePermissions(held, [requested]).length === 0;
};

describe("canGrantPermissions: names", () => {
    it("full access may grant anything", () => {
        expect(canGrant([{ name: "*" }], [{ name: "*" }])).toBe(true);
        expect(canGrant([{ name: "*" }], [{ name: "cms.*" }, { name: "x", foo: 1 }])).toBe(true);
    });

    it("nothing held grants nothing", () => {
        expect(canGrant([], [{ name: "security.role" }])).toBe(false);
        expect(canGrant([], [])).toBe(true);
    });

    it("an exact name is covered", () => {
        expect(canGrant([{ name: "security.role" }], [{ name: "security.role" }])).toBe(true);
        expect(canGrant([{ name: "security.role" }], [{ name: "security.team" }])).toBe(false);
    });

    it("a held wildcard covers matching names and nothing else", () => {
        const held = [{ name: "fm.*" }];
        expect(canGrant(held, [{ name: "fm.file", rwd: "rwd" }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.*" }])).toBe(true);
        expect(canGrant(held, [{ name: "cms.contentEntry" }])).toBe(false);
        expect(canGrant(held, [{ name: "*" }])).toBe(false);
    });

    it("a requested wildcard is not covered by a narrower name", () => {
        expect(canGrant([{ name: "cms.contentEntry" }], [{ name: "cms.*" }])).toBe(false);
        expect(canGrant([{ name: "cms.*" }], [{ name: "c*" }])).toBe(false);
    });

    it("a requested pattern beyond a trailing `.*` must be held verbatim", () => {
        expect(canGrant([{ name: "fm.*" }], [{ name: "{fm.file,security.role}" }])).toBe(false);
        expect(canGrant([{ name: "fm.*" }], [{ name: "fm.?ile" }])).toBe(false);
        expect(canGrant([{ name: "fm.?ile" }], [{ name: "fm.?ile" }])).toBe(true);
    });

    it("a held wildcard with restrictions is not full access", () => {
        const held = [{ name: "fm.*", rwd: "r" }];
        expect(canGrant(held, [{ name: "fm.file", rwd: "r" }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.file", rwd: "rw" }])).toBe(false);
        expect(canGrant(held, [{ name: "fm.file" }])).toBe(false);
    });
});

describe("canGrantPermissions: rwd and pw", () => {
    it("requires the held letters to be a superset", () => {
        const held = [{ name: "fm.file", rwd: "rw" }];
        expect(canGrant(held, [{ name: "fm.file", rwd: "r" }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.file", rwd: "wr" }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.file", rwd: "rwd" }])).toBe(false);
        expect(canGrant(held, [{ name: "fm.file", rwd: "d" }])).toBe(false);
    });

    it("treats a missing rwd as full access", () => {
        expect(canGrant([{ name: "fm.file", rwd: "rwd" }], [{ name: "fm.file" }])).toBe(false);
        expect(canGrant([{ name: "fm.file" }], [{ name: "fm.file" }])).toBe(true);
        // Not comparable safely: a held permission without `rwd` vs. a requested one with it.
        expect(canGrant([{ name: "fm.file" }], [{ name: "fm.file", rwd: "r" }])).toBe(false);
    });

    it("compares pw letters, and a missing or empty pw grants nothing", () => {
        const held = [{ name: "x.entry", rwd: "rwd", pw: "p" }];
        expect(canGrant(held, [{ name: "x.entry", rwd: "r", pw: "p" }])).toBe(true);
        expect(canGrant(held, [{ name: "x.entry", rwd: "r", pw: "" }])).toBe(true);
        expect(canGrant(held, [{ name: "x.entry", rwd: "r" }])).toBe(true);
        expect(canGrant(held, [{ name: "x.entry", rwd: "r", pw: "pu" }])).toBe(false);
        expect(
            canGrant([{ name: "x.entry", rwd: "r" }], [{ name: "x.entry", rwd: "r", pw: "p" }])
        ).toBe(false);
    });
});

describe("canGrantPermissions: own", () => {
    it("held own: true only covers requested own: true", () => {
        const held = [{ name: "fm.file", rwd: "rwd", own: true }];
        expect(canGrant(held, [{ name: "fm.file", rwd: "r", own: true }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.file", rwd: "r", own: false }])).toBe(false);
        expect(canGrant(held, [{ name: "fm.file", rwd: "r" }])).toBe(false);
    });

    it("held own: false covers both", () => {
        const held = [{ name: "fm.file", rwd: "rwd", own: false }];
        expect(canGrant(held, [{ name: "fm.file", rwd: "r", own: true }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.file", rwd: "r", own: false }])).toBe(true);
        expect(canGrant(held, [{ name: "fm.file", rwd: "r" }])).toBe(true);
    });
});

describe("canGrantPermissions: models and groups", () => {
    it("a held list only covers a requested subset", () => {
        const held = [{ name: "cms.contentEntry", rwd: "r", models: ["a", "b"] }];
        expect(canGrant(held, [{ name: "cms.contentEntry", rwd: "r", models: ["a"] }])).toBe(true);
        expect(canGrant(held, [{ name: "cms.contentEntry", rwd: "r", models: [] }])).toBe(true);
        expect(canGrant(held, [{ name: "cms.contentEntry", rwd: "r", models: ["a", "c"] }])).toBe(
            false
        );
        // No list means "all models".
        expect(canGrant(held, [{ name: "cms.contentEntry", rwd: "r" }])).toBe(false);
    });

    it("a missing held list means no restriction", () => {
        const held = [{ name: "cms.contentModel", rwd: "rw" }];
        expect(canGrant(held, [{ name: "cms.contentModel", rwd: "r", models: ["x"] }])).toBe(true);
        expect(canGrant(held, [{ name: "cms.contentModel", rwd: "r", groups: ["g"] }])).toBe(true);
    });

    it("non-list values must be equal", () => {
        const held = [{ name: "cms.contentModel", rwd: "r", models: { en: ["a", "b"] } }];
        expect(
            canGrant(held, [{ name: "cms.contentModel", rwd: "r", models: { en: ["a", "b"] } }])
        ).toBe(true);
        expect(
            canGrant(held, [{ name: "cms.contentModel", rwd: "r", models: { en: ["a"] } }])
        ).toBe(false);
    });
});

describe("canGrantPermissions: other properties", () => {
    it("must match exactly", () => {
        const held = [{ name: "wb.page", rwd: "r", publish: true }];
        expect(canGrant(held, [{ name: "wb.page", rwd: "r", publish: true }])).toBe(true);
        expect(canGrant(held, [{ name: "wb.page", rwd: "r", publish: false }])).toBe(false);
        expect(canGrant(held, [{ name: "wb.page", rwd: "r" }])).toBe(false);
        expect(
            canGrant([{ name: "wb.page", rwd: "r" }], [{ name: "wb.page", rwd: "r", x: 1 }])
        ).toBe(false);
    });

    it("ignores `_src`", () => {
        expect(
            permissionCovers(
                { name: "fm.file", rwd: "r", _src: "role:a" },
                { name: "fm.file", rwd: "r", _src: "something-else" }
            )
        ).toBe(true);
    });

    it("independent permissions may come from different held roles", () => {
        const held = [
            { name: "fm.file", rwd: "r", _src: "role:a" },
            { name: "security.role", _src: "role:b" }
        ];
        expect(canGrant(held, [{ name: "fm.file", rwd: "r" }, { name: "security.role" }])).toBe(
            true
        );
    });
});

describe("canGrantPermissions: linked Headless CMS permissions", () => {
    const roleA = [
        { name: "cms.contentModelGroup", rwd: "r", groups: ["g1"], _src: "role:a" },
        { name: "cms.contentModel", rwd: "r", _src: "role:a" },
        { name: "cms.contentEntry", rwd: "r", _src: "role:a" }
    ];
    const roleB = [
        { name: "cms.contentModelGroup", rwd: "r", groups: ["g2"], _src: "role:b" },
        { name: "cms.contentModel", rwd: "r", _src: "role:b" },
        { name: "cms.contentEntry", rwd: "rwd", pw: "pu", _src: "role:b" }
    ];

    it("covers a requested set held by one of the caller's roles", () => {
        expect(
            canGrant(
                [...roleA, ...roleB],
                [
                    { name: "cms.contentModelGroup", rwd: "r", groups: ["g2"] },
                    { name: "cms.contentModel", rwd: "r" },
                    { name: "cms.contentEntry", rwd: "rw", pw: "p" }
                ]
            )
        ).toBe(true);
    });

    it("refuses combining permissions from different roles into more access", () => {
        // Groups from role A (g1) combined with entry access from role B (rwd) would grant
        // write access to g1, which the caller doesn't have.
        expect(
            canGrant(
                [...roleA, ...roleB],
                [
                    { name: "cms.contentModelGroup", rwd: "r", groups: ["g1"] },
                    { name: "cms.contentModel", rwd: "r" },
                    { name: "cms.contentEntry", rwd: "rwd" }
                ]
            )
        ).toBe(false);
    });

    it("only the first held permission of each name in a role counts", () => {
        const held = [
            { name: "cms.contentEntry", rwd: "r", _src: "role:a" },
            { name: "cms.contentEntry", rwd: "rwd", _src: "role:a" }
        ];
        expect(canGrant(held, [{ name: "cms.contentEntry", rwd: "rwd" }])).toBe(false);
        expect(canGrant(held, [{ name: "cms.contentEntry", rwd: "r" }])).toBe(true);
    });

    it("a held `cms.*` covers any CMS permission", () => {
        expect(
            canGrant(
                [{ name: "cms.*", _src: "role:a" }],
                [
                    { name: "cms.contentModelGroup" },
                    { name: "cms.contentModel" },
                    { name: "cms.contentEntry", rwd: "rwd", pw: "pu" }
                ]
            )
        ).toBe(true);
    });

    it("checks each requested role separately", () => {
        const held = [...roleA, ...roleB];
        const requestedA = [
            { name: "cms.contentModelGroup", rwd: "r", groups: ["g1"] },
            { name: "cms.contentEntry", rwd: "r" }
        ];
        const requestedB = [
            { name: "cms.contentModelGroup", rwd: "r", groups: ["g2"] },
            { name: "cms.contentEntry", rwd: "rwd" }
        ];
        expect(findUngrantablePermissions(held, [requestedA, requestedB])).toEqual([]);
        expect(findUngrantablePermissions(held, [[...requestedA, requestedB[1]]])).not.toEqual([]);
    });
});

describe("canGrantPermissions: identity context", () => {
    const createIdentityContext = (params: {
        authorization: boolean;
        permissions: SecurityPermission[];
    }) => {
        return {
            isAuthorizationEnabled: () => params.authorization,
            listPermissions: async () => params.permissions,
            hasFullAccess: async () => params.permissions.some(p => p.name === "*")
        } as unknown as IdentityContext.Interface;
    };

    it("grants anything when authorization is disabled", async () => {
        const identityContext = createIdentityContext({ authorization: false, permissions: [] });
        await expect(canGrantPermissions(identityContext, [[{ name: "*" }]])).resolves.toBe(true);
        await expect(hasFullAccessOrNoAuthorization(identityContext)).resolves.toBe(true);
    });

    it("checks the identity's permissions when authorization is enabled", async () => {
        const identityContext = createIdentityContext({
            authorization: true,
            permissions: [{ name: "security.role" }]
        });
        await expect(
            canGrantPermissions(identityContext, [[{ name: "security.role" }]])
        ).resolves.toBe(true);
        await expect(canGrantPermissions(identityContext, [[{ name: "*" }]])).resolves.toBe(false);
        await expect(hasFullAccessOrNoAuthorization(identityContext)).resolves.toBe(false);
    });

    it("full access has full access", async () => {
        const identityContext = createIdentityContext({
            authorization: true,
            permissions: [{ name: "*" }]
        });
        await expect(hasFullAccessOrNoAuthorization(identityContext)).resolves.toBe(true);
        await expect(canGrantPermissions(identityContext, [[{ name: "*" }]])).resolves.toBe(true);
    });
});
