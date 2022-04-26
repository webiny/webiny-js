import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { defaultIdentity } from "../utils/defaultIdentity";

const identityRoot = { id: "root", displayName: "root", type: "admin" };
const updatedDisplayName = "Robert Downey";

describe("Reviewer crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const { securityIdentity, reviewer, until } = useContentGqlHandler({
        ...options,
        plugins: [defaultIdentity()]
    });

    const { securityIdentity: securityIdentityRoot } = useContentGqlHandler({
        ...options,
        plugins: [defaultIdentity()],
        identity: identityRoot
    });

    const { securityIdentity: securityIdentityRootUpdated } = useContentGqlHandler({
        ...options,
        plugins: [defaultIdentity()],
        identity: {
            ...identityRoot,
            displayName: updatedDisplayName
        }
    });

    it("should be able to hook on to after login", async () => {
        const [response] = await securityIdentity.login();
        expect(response).toEqual({
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
                                type: "admin"
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
                                type: "admin"
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
                                type: "admin"
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
        expect(response).toEqual({
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
                                type: "admin"
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
                                type: "admin"
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
        expect(response).toEqual({
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
                                type: "admin"
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
                                type: "admin"
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
});
