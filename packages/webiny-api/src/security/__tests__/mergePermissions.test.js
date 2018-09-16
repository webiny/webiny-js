import mergePermissions from "./../mergePermissions";

describe("merge permissions test", () => {
    test("must return empty object if invalid argument was passed", () => {
        let current = mergePermissions();
        expect(current).toEqual({});

        current = mergePermissions(current);
        expect(current).toEqual({});

        current = mergePermissions({ api: {} });
        expect(current).toEqual({});

        current = mergePermissions([]);
        expect(current).toEqual({});
    });

    test(`"*" permission always has advantage`, () => {
        const permissions1 = {
            entities: {
                User: "*",
                Page: {
                    owner: ["read"],
                    other: "*"
                }
            }
        };

        let current = mergePermissions([permissions1, {}]);
        expect(current).toEqual({
            entities: {
                User: "*",
                Page: {
                    owner: ["read"],
                    other: "*"
                }
            }
        });

        // Override Page with "*".
        current = mergePermissions([
            current,
            {
                entities: {
                    User: {
                        owner: ["read"]
                    },
                    Page: "*"
                }
            }
        ]);

        expect(current).toEqual({
            entities: {
                User: "*",
                Page: "*"
            }
        });

        // Try to reduce access on User entity, should not succeed ("*" should still be present).
        current = mergePermissions([
            current,
            {
                entities: {
                    User: {
                        owner: ["read"]
                    },
                    Page: "*",
                    Company: {
                        owner: ["read"],
                        other: "*"
                    }
                }
            }
        ]);

        expect(current).toEqual({
            entities: {
                User: "*",
                Page: "*",
                Company: {
                    owner: ["read"],
                    other: "*"
                }
            }
        });

        //
        current = mergePermissions([
            current,
            {
                entities: {
                    User: {
                        owner: ["read"]
                    },
                    Page: "*",
                    Company: {
                        owner: "*",
                        other: ["read"]
                    }
                }
            }
        ]);

        expect(current).toEqual({
            entities: {
                User: "*",
                Page: "*",
                Company: {
                    owner: "*",
                    other: "*"
                }
            }
        });
    });

    test(`should append operations only if not present already`, () => {
        let current = mergePermissions([
            {
                entities: {
                    Page: {
                        owner: ["read"],
                        other: "*"
                    }
                }
            },
            {
                entities: {
                    Page: {
                        owner: ["read", "create", "update", "delete", "delete"],
                        other: ["create"],
                        group: ["read", "create", "update", "delete", "delete"]
                    }
                }
            },
            {
                entities: {
                    Page: {
                        owner: ["read", "create", "update", "delete", "delete"],
                        other: ["create"],
                        group: ["read", "create", "update", "delete", "delete"]
                    }
                }
            }
        ]);

        expect(current).toEqual({
            entities: {
                Page: {
                    owner: ["read", "create", "update", "delete"],
                    other: "*",
                    group: ["read", "create", "update", "delete"]
                }
            }
        });
    });

    test(`should append operations only if not present already`, () => {
        let current = mergePermissions([
            {
                entities: {
                    Page: {
                        owner: ["read"],
                        other: "*"
                    }
                }
            },
            {
                entities: {
                    Page: {
                        owner: ["read", "create", "update", "delete", "delete"],
                        other: ["create"],
                        group: ["read", "create", "update", "delete", "delete"]
                    }
                }
            },
            {
                entities: {
                    Page: {
                        owner: ["read", "create", "update", "delete", "delete"],
                        other: ["create"],
                        group: ["read", "create", "update", "delete", "delete"]
                    }
                }
            }
        ]);

        expect(current).toEqual({
            entities: {
                Page: {
                    owner: ["read", "create", "update", "delete"],
                    other: "*",
                    group: ["read", "create", "update", "delete"]
                }
            }
        });
    });

    test(`should merge api correctly and give advantage to "*" rule`, () => {
        let current = mergePermissions([
            {
                api: {
                    Security: {
                        ApiToken: {
                            one: ["id", "name", "slug"],
                            list: {
                                meta: ["totalCount", "count", "totalPages"],
                                data: {
                                    id: true,
                                    name: true,
                                    group: ["name", "id"]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        expect(current).toEqual({
            api: {
                Security: {
                    ApiToken: {
                        one: {id: true, name: true, slug: true},
                        list: {
                            meta: {totalCount: true, count: true, totalPages: true},
                            data: {
                                id: true,
                                name: true,
                                group: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        });

        current = mergePermissions([
            {
                api: "*"
            },
            {
                Security: true
            }
        ]);

        expect(current).toEqual({
            api: "*"
        });
    });

    test(`must merge "*" permissions to both "api" and "entities" sections`, () => {
        let current = mergePermissions([
            {
                api: {},
                entities: {}
            },
            {
                api: "*",
                entities: "*"
            }
        ]);

        expect(current).toEqual({
            api: "*",
            entities: "*"
        });
    });

    test(`must merge "*" permissions to both "api" and "entities" sections`, () => {
        const permissionsToMerge = [
            {},
            {
                api: {
                    Security: {
                        Users: {
                            authenticate: {
                                token: true,
                                identity: {
                                    id: true,
                                    email: true,
                                    groups: ["id", "slug"],
                                    gravatar: true,
                                    lastName: true,
                                    firstName: true
                                },
                                expiresOn: true
                            }
                        }
                    }
                },
                entities: { SecurityUser: { other: ["read"] } }
            }
        ];

        let current = mergePermissions(permissionsToMerge);

        expect(current).toEqual({
            api: {
                Security: {
                    Users: {
                        authenticate: {
                            token: true,
                            identity: {
                                id: true,
                                email: true,
                                groups: {id: true, slug: true},
                                gravatar: true,
                                lastName: true,
                                firstName: true
                            },
                            expiresOn: true
                        }
                    }
                }
            },
            entities: { SecurityUser: { other: ["read"] } }
        });
    });
});
