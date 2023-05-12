import useGqlHandler from "./useGqlHandler";
import { identityA, identityB, NOT_AUTHORIZED_RESPONSE } from "./mocks";
import { Page } from "~/types";
import { SecurityPermission, SecurityIdentity } from "@webiny/api-security/types";

jest.setTimeout(100000);

describe("publishing workflow", () => {
    const { createPage, updatePage } = useGqlHandler();

    const handlerA = useGqlHandler({
        identity: identityA
    });

    const createInitialData = async () => {
        const { createCategory } = useGqlHandler();
        const pages: Page[] = [];
        const category = await createCategory({
            data: {
                slug: `category`,
                name: `name`,
                url: `/some-url/`,
                layout: `layout`
            }
        }).then(([res]) => res.data.pageBuilder.createCategory.data);

        const letters = ["a", "z", "b"];
        for (const letter of letters) {
            const [response] = await createPage({ category: "category" });
            const { id } = response.data.pageBuilder.createPage.data;
            const [updatePageResponse] = await updatePage({
                id,
                data: {
                    title: `page-${letter}`
                }
            });
            pages.push(updatePageResponse.data.pageBuilder.updatePage.data);
        }

        return {
            category,
            pages
        };
    };

    const publishSufficientPermission: [SecurityPermission<any>, SecurityIdentity][] = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "p" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "p" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true, pw: "p" }], identityA]
    ];

    test.each(publishSufficientPermission)(
        "should be able to publish if has permission",
        async (permissions, identity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(([res]) => res.data.pageBuilder.createPage.data);

            // Publish page with specific identity and permissions.

            const { publishPage } = useGqlHandler({ permissions, identity });

            const [response] = await publishPage({ id: page.id });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: { publishPage: { data: { id: page.id, status: "published" } } }
                }
            });
        }
    );

    const publishInsufficientPermissions: [
        SecurityPermission<any>,
        SecurityIdentity | undefined
    ][] = [
        [[], undefined],
        [[], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "rcu" }], identityA],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcu" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcu" }
            ],
            identityB
        ],
        // Although the user has all of the `rcpu`, he can only perform these on own records.
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", own: true, pw: "rpcu" }
            ],
            identityB
        ]
    ];

    test.each(publishInsufficientPermissions)(
        "should not be able to publish if no permission",
        async (permissions, identity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const page = await handlerA
                .createPage({ category: category.slug })
                .then(([res]) => res.data.pageBuilder.createPage.data);

            // Publish page with specific identity and permissions.

            const { publishPage } = useGqlHandler({ permissions, identity });

            const [response] = await publishPage({ id: page.id });
            expect(response).toMatchObject(NOT_AUTHORIZED_RESPONSE("publishPage"));
        }
    );

    const unpublishSufficientPermissions: [SecurityPermission<any>, SecurityIdentity][] = [
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityA],
        [[{ name: "content.i18n", locales: ["en-US"] }, { name: "pb.page" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "u" }], identityA],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "u" }], identityB],
        [[{ name: "content.i18n" }, { name: "pb.page", own: true, pw: "u" }], identityA]
    ];

    test.each(unpublishSufficientPermissions)(
        "should be able to unpublish if has permission",
        async (permissions, identity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const [createResponse] = await handlerA.createPage({ category: category.slug });

            const page = createResponse.data.pageBuilder.createPage.data;
            await handlerA.publishPage({ id: page.id });

            // Unpublish page with specific identity and permissions.
            const { unpublishPage } = useGqlHandler({ permissions, identity });

            const [response] = await unpublishPage({ id: page.id });

            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        unpublishPage: { data: { id: page.id, status: "unpublished" } }
                    }
                }
            });
        }
    );
    const unpublishInsufficientPermissions: [
        SecurityPermission<any>,
        SecurityIdentity | undefined
    ][] = [
        [[], undefined],
        [[], identityA],
        // Has all, except access to `en-EN` (has `de-DE`).
        [
            [
                { name: "content.i18n", locales: ["de-DE"] },
                { name: "pb.page", pw: "rcpu" }
            ],
            identityA
        ],
        [[{ name: "content.i18n" }, { name: "pb.page", pw: "rcp" }], identityA],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcp" }
            ],
            identityA
        ],
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", pw: "rcp" }
            ],
            identityB
        ],
        // Although the user has all of the `rcpu`, he can only perform these on own records.
        [
            [
                { name: "content.i18n", locales: ["en-US"] },
                { name: "pb.page", own: true, pw: "rpcu" }
            ],
            identityB
        ]
    ];

    test.each(unpublishInsufficientPermissions)(
        "should not be able to unpublish if no permission",
        async (permissions, identity) => {
            const { category } = await createInitialData();

            // Create page with identityA.
            const [createResponse] = await handlerA.createPage({ category: category.slug });

            const page = createResponse.data.pageBuilder.createPage.data;

            await handlerA.publishPage({ id: page.id });

            // Unpublish page with specific identity and permissions.

            const { unpublishPage } = useGqlHandler({ permissions, identity });

            const [response] = await unpublishPage({ id: page.id });

            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("unpublishPage"));
        }
    );
});
