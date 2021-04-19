import { migrateCMSPermissions } from "../../src/migrateCMSPermissions";

describe("migrate CMS permissions from v5.4.0 to v5.5.0", () => {
    test("should return same permission in case of 'full access'", async () => {
        const permissions = [{ name: "cms.*" }];

        const result = migrateCMSPermissions(permissions);

        expect(result).toEqual(permissions);
    });

    test("case 1", () => {
        const prevPermissions = [
            {
                name: "cms.contentModel",
                models: { "en-US": ["iPhone", "mac"] },
                rwd: "r",
                own: false,
                pw: null
            },
            { name: "cms.contentModelGroup", rwd: "r", own: false, pw: null },
            {
                name: "cms.contentEntry",
                groups: { "en-US": ["607976acdbbbbb0008a9d2cc", "607976e3746db30008452c8f"] },
                rwd: "r",
                own: false,
                pw: null
            }
        ];

        const nextPermissions = [
            {
                name: "cms.contentModelGroup",
                rwd: "r",
                own: false,
                pw: null,
                groups: { "en-US": ["607976acdbbbbb0008a9d2cc", "607976e3746db30008452c8f"] }
            },
            {
                name: "cms.contentModel",
                models: { "en-US": ["iPhone", "mac"] },
                rwd: "r",
                own: false,
                pw: null
            },
            {
                name: "cms.contentEntry",
                rwd: "r",
                own: false,
                pw: null
            }
        ];

        const result = migrateCMSPermissions(prevPermissions);

        expect(result).toEqual(nextPermissions);
    });

    test("case 2", () => {
        const prevPermissions = [
            {
                name: "cms.contentModel",
                models: { "en-US": ["iPhone", "watch"], "en-UK": ["tv+"] },
                groups: { "en-US": ["someGroupId"] },
                rwd: "r",
                own: false,
                pw: null
            },
            {
                name: "cms.contentModelGroup",
                rwd: "r",
                own: false,
                pw: null,
                groups: { "en-US": ["dummyId", "607976e3746db30008452c8f"] }
            },
            {
                name: "cms.contentEntry",
                groups: { "en-US": ["607976acdbbbbb0008a9d2cc", "607976e3746db30008452c8f"] },
                models: { "en-US": ["iPhone", "mac"] },
                rwd: "r",
                own: false,
                pw: null
            }
        ];

        const nextPermissions = [
            {
                name: "cms.contentModelGroup",
                rwd: "r",
                own: false,
                pw: null,
                groups: {
                    "en-US": [
                        "dummyId",
                        "607976e3746db30008452c8f",
                        "someGroupId",
                        "607976acdbbbbb0008a9d2cc"
                    ]
                }
            },
            {
                name: "cms.contentModel",
                models: { "en-US": ["iPhone", "watch", "mac"], "en-UK": ["tv+"] },
                rwd: "r",
                own: false,
                pw: null
            },
            {
                name: "cms.contentEntry",
                rwd: "r",
                own: false,
                pw: null
            }
        ];

        const result = migrateCMSPermissions(prevPermissions);

        expect(result).toEqual(nextPermissions);
    });
});

describe(`should handle "own" access scope`, () => {
    test(`case 1`, () => {
        const prevPermissions = [
            {
                name: "cms.contentModel",
                rwd: "rwd",
                own: true,
                pw: null
            },
            {
                name: "cms.contentEntry",
                groups: { "en-US": ["607976acdbbbbb0008a9d2cc", "607976e3746db30008452c8f"] },
                models: { "en-US": ["iPhone", "mac"] },
                rwd: "r",
                own: false,
                pw: null
            }
        ];

        const nextPermissions = [
            {
                name: "cms.contentModelGroup",
                rwd: "r",
                own: false
            },
            {
                name: "cms.contentModel",
                rwd: "rwd",
                own: true,
                pw: null
            },
            {
                name: "cms.contentEntry",
                rwd: "rwd",
                own: true,
                pw: null
            }
        ];

        const result = migrateCMSPermissions(prevPermissions);

        expect(result).toEqual(nextPermissions);
    });

    test("case 2", () => {
        const prevPermissions = [
            {
                name: "cms.contentModelGroup",
                rwd: "r",
                own: true
            },
            {
                name: "cms.contentModel",
                rwd: "rwd",
                own: true,
                pw: null
            },
            {
                name: "cms.contentEntry",
                groups: { "en-US": ["607976acdbbbbb0008a9d2cc", "607976e3746db30008452c8f"] },
                models: { "en-US": ["iPhone", "mac"] },
                rwd: "r",
                own: false,
                pw: null
            }
        ];

        const nextPermissions = [
            {
                name: "cms.contentModelGroup",
                rwd: "rwd",
                own: true
            },
            {
                name: "cms.contentModel",
                rwd: "rwd",
                own: true,
                pw: null
            },
            {
                name: "cms.contentEntry",
                rwd: "rwd",
                own: true,
                pw: null
            }
        ];

        const result = migrateCMSPermissions(prevPermissions);

        expect(result).toEqual(nextPermissions);
    });

    test("case 3", () => {
        const prevPermissions = [
            {
                name: "cms.contentEntry",
                groups: { "en-US": ["607976acdbbbbb0008a9d2cc", "607976e3746db30008452c8f"] },
                models: { "en-US": ["iPhone", "mac"] },
                rwd: "r",
                own: true,
                pw: null
            }
        ];

        const nextPermissions = [
            {
                name: "cms.contentModelGroup",
                rwd: "r",
                own: false
            },
            {
                name: "cms.contentModel",
                rwd: "r",
                own: false
            },
            {
                name: "cms.contentEntry",
                rwd: "rwd",
                own: true,
                pw: null
            }
        ];

        const result = migrateCMSPermissions(prevPermissions);

        expect(result).toEqual(nextPermissions);
    });
});

test("Sample", () => {
    const permissions = [
        { name: "content.i18n" },
        { name: "cms.endpoints.manage" },
        { name: "cms.*" },
        { name: "fm.file" }
    ];

    const cmsOnly = permissions.filter(p => p.name.includes("cms."));
    const cmsEndpointsOnly = permissions.filter(p => p.name.includes("cms.endpoints."));
    const rest = permissions.filter(p => !p.name.includes("cms."));

    expect(cmsEndpointsOnly).toHaveLength(1);
    console.log(cmsEndpointsOnly);
    expect(cmsOnly).toEqual([{ name: "cms.endpoints.manage" }, { name: "cms.*" }]);
    expect(rest).toEqual([{ name: "content.i18n" }, { name: "fm.file" }]);
});
