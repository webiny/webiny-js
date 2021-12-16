import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { defaultIdentity } from "../utils/defaultIdentity";

const identityRoot = { id: "root", displayName: "root", type: "admin" };

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
            response => {
                const list = response.data.advancedPublishingWorkflow.listReviewers.data;
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
                advancedPublishingWorkflow: {
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
                                displayName: "John Doe"
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
            response => {
                const list = response.data.advancedPublishingWorkflow.listReviewers.data;
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
                advancedPublishingWorkflow: {
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
                                displayName: identityRoot.displayName
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
                                displayName: "John Doe"
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
            response => {
                const list = response.data.advancedPublishingWorkflow.listReviewers.data;
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
                advancedPublishingWorkflow: {
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
                                displayName: "John Doe"
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
            response => {
                const list = response.data.advancedPublishingWorkflow.listReviewers.data;
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
                advancedPublishingWorkflow: {
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
                                displayName: "John Doe"
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
