import { useGraphQlHandler } from "~tests/utils/useGraphQlHandler";
import { defaultIdentity } from "../utils/defaultIdentity";

const identityRoot = {
    id: "root",
    displayName: "root",
    type: "admin",
    email: "root@webiny.com"
};
const updatedDisplayName = "Robert Downey";

describe("Reviewer crud test", () => {
    const { securityIdentity, reviewer, until } = useGraphQlHandler({
        path: "/graphql",
        plugins: [defaultIdentity()]
    });

    const { securityIdentity: securityIdentityRoot } = useGraphQlHandler({
        path: "/graphql",
        plugins: [defaultIdentity()],
        identity: identityRoot
    });

    const { securityIdentity: securityIdentityRootUpdated } = useGraphQlHandler({
        path: "/graphql",
        plugins: [defaultIdentity()],
        identity: {
            ...identityRoot,
            displayName: updatedDisplayName
        }
    });

    it("should be able to hook on to after login", async () => {
        const [response] = await securityIdentity.login();
        expect(response).toMatchObject({
            data: {
                security: {
                    login: {
                        data: {
                            id: "12345678"
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 1;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        /**
         * Should created a reviewer entry after login.
         */
        const [listReviewersResponse] = await reviewer.listReviewersQuery({});
        expect(listReviewersResponse).toEqual({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                identityId: "12345678",
                                displayName: "John Doe",
                                type: "admin",
                                email: "testing@webiny.com"
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        }
                    }
                }
            }
        });
        /*
         * Login with another identity.
         */
        await securityIdentityRoot.login();

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 2;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        /**
         * Should now have 2 reviewers.
         */
        const [listReviewersAgainResponse] = await reviewer.listReviewersQuery({});
        expect(listReviewersAgainResponse).toEqual({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: identityRoot.id,
                                    displayName: identityRoot.displayName,
                                    type: identityRoot.type
                                },
                                identityId: identityRoot.id,
                                displayName: identityRoot.displayName,
                                type: "admin",
                                email: identityRoot.email
                            },
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                identityId: "12345678",
                                displayName: "John Doe",
                                type: "admin",
                                email: "testing@webiny.com"
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 2
                        }
                    }
                }
            }
        });
    });

    it("should not create more than one entry due to multiple login", async () => {
        const [response] = await securityIdentity.login();
        expect(response).toMatchObject({
            data: {
                security: {
                    login: {
                        data: {
                            id: "12345678"
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 1;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        /**
         * Should created a reviewer entry after login.
         */
        const [listReviewersResponse] = await reviewer.listReviewersQuery({});
        expect(listReviewersResponse).toEqual({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                identityId: "12345678",
                                displayName: "John Doe",
                                type: "admin",
                                email: "testing@webiny.com"
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        }
                    }
                }
            }
        });
        /*
         * Login again with same identity.
         */
        await securityIdentity.login();

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 1;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        /*
         * Should not have 2 reviewers.
         */
        const [listReviewersAgainResponse] = await reviewer.listReviewersQuery({});
        expect(listReviewersAgainResponse).toEqual({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                identityId: "12345678",
                                displayName: "John Doe",
                                type: "admin",
                                email: "testing@webiny.com"
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        }
                    }
                }
            }
        });
    });

    it(`should update "displayName" after login if identity has been updated`, async () => {
        const [response] = await securityIdentityRoot.login();
        expect(response).toMatchObject({
            data: {
                security: {
                    login: {
                        data: {
                            id: "root"
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 1;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        /**
         * Should created a reviewer entry after login.
         */
        const [listReviewersResponse] = await reviewer.listReviewersQuery({});
        expect(listReviewersResponse).toEqual({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "root",
                                    displayName: "root",
                                    type: "admin"
                                },
                                identityId: "root",
                                displayName: "root",
                                type: "admin",
                                email: identityRoot.email
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        }
                    }
                }
            }
        });
        /*
         * Login again with same identity.
         */
        await securityIdentityRootUpdated.login();

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 1;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        /*
         * Should not have 2 reviewers.
         */
        const [listReviewersAgainResponse] = await reviewer.listReviewersQuery({});
        expect(listReviewersAgainResponse).toEqual({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                id: expect.any(String),
                                createdOn: expect.stringMatching(/^20/),
                                savedOn: expect.stringMatching(/^20/),
                                createdBy: {
                                    id: "root",
                                    displayName: "root",
                                    type: "admin"
                                },
                                identityId: "root",
                                displayName: updatedDisplayName,
                                type: "admin",
                                email: identityRoot.email
                            }
                        ],
                        error: null,
                        meta: {
                            hasMoreItems: false,
                            cursor: null,
                            totalCount: 1
                        }
                    }
                }
            }
        });
    });

    it("should update reviewer when login info changes", async () => {
        const { securityIdentity: baseSecurityIdentity, reviewer } = useGraphQlHandler({
            path: "/graphql",
            identity: {
                id: "mockUpdateIdentityId",
                type: "admin",
                displayName: "Base Identity"
            }
        });
        await securityIdentity.login();
        await baseSecurityIdentity.login();

        await until(
            () => reviewer.listReviewersQuery({}).then(([data]) => data),
            (response: any) => {
                const list = response.data.apw.listReviewers.data;
                return list.length === 2;
            },
            {
                name: "Wait for listReviewers query"
            }
        );

        const [response] = await reviewer.listReviewersQuery({});

        expect(response).toMatchObject({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                identityId: "mockUpdateIdentityId"
                            },
                            {
                                identityId: "12345678"
                            }
                        ],
                        error: null,
                        meta: {
                            totalCount: 2,
                            hasMoreItems: false,
                            cursor: null
                        }
                    }
                }
            }
        });

        const email = "mock@webiny.local";

        const { securityIdentity: updatedSecurityIdentity, reviewer: updatedReviewer } =
            useGraphQlHandler({
                path: "/graphql",
                identity: {
                    id: "mockUpdateIdentityId",
                    type: "admin",
                    displayName: "Base Identity",
                    email
                },
                permissions: []
            });

        await updatedSecurityIdentity.login();

        await until(
            () => updatedReviewer.listReviewersQuery({}),
            data => {
                const response = data[0] as unknown as Record<string, any>;
                const list = response.data.apw.listReviewers.data;
                if (list.length !== 2) {
                    return false;
                }
                return list.some((reviewer: any) => reviewer.email === email);
            },
            {
                name: "Wait for listReviewers query after updated login"
            }
        );

        const [responseAfterUpdatedLogin] = await reviewer.listReviewersQuery({});

        expect(responseAfterUpdatedLogin).toMatchObject({
            data: {
                apw: {
                    listReviewers: {
                        data: [
                            {
                                identityId: "mockUpdateIdentityId",
                                email
                            },
                            {
                                identityId: "12345678"
                            }
                        ],
                        error: null,
                        meta: {
                            totalCount: 2,
                            hasMoreItems: false,
                            cursor: null
                        }
                    }
                }
            }
        });
    });
});
