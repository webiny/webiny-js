import { ListPages } from "~/features/pages/listPages/ListPages.js";
import { statuses } from "~/constants.js";
import { pageCacheFactory } from "~/domains/Page/index.js";

describe("ListPages", () => {
    const gateway = {
        execute: jest.fn().mockResolvedValue({
            pages: [
                {
                    id: "page-1#0001",
                    entryId: "page-1",
                    status: statuses.draft,
                    wbyAco_location: {
                        folderId: "folder-1"
                    },
                    properties: {
                        title: "Page 1"
                    },
                    metadata: {
                        metadata: "data-1"
                    },
                    elements: {
                        element1: "element"
                    },
                    bindings: {
                        data: "any-data"
                    }
                },
                {
                    id: "page-2#0001",
                    entryId: "page-2",
                    status: statuses.draft,
                    wbyAco_location: {
                        folderId: "folder-1"
                    },
                    properties: {
                        title: "Page 2"
                    },
                    metadata: {
                        metadata: "data-2"
                    },
                    elements: {
                        element1: "element"
                    },
                    bindings: {
                        data: "any-data"
                    }
                },
                {
                    id: "page-3#0001",
                    entryId: "page-3",
                    status: statuses.draft,
                    wbyAco_location: {
                        folderId: "folder-1"
                    },
                    properties: {
                        title: "Page 3"
                    },
                    metadata: {
                        metadata: "data-3"
                    },
                    elements: {
                        element1: "element"
                    },
                    bindings: {
                        data: "any-data"
                    }
                }
            ],
            meta: {
                hasMoreItems: false,
                cursor: null,
                totalCount: 3
            }
        })
    };
    const pagesCache = pageCacheFactory.getCache();

    beforeEach(() => {
        pagesCache.clear();
        jest.clearAllMocks();
    });

    it("should be able to list pages", async () => {
        const listPages = ListPages.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await listPages.execute({
            where: {
                wbyAco_location: {
                    folderId: "folder-1"
                }
            }
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith({
            where: {
                wbyAco_location: {
                    folderId: "folder-1"
                }
            },
            limit: 50
        });
        expect(pagesCache.hasItems()).toBeTrue();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(3);
    });

    it("should be able to list pages more than once, resetting the pages stored in cache", async () => {
        const gateway = {
            execute: jest
                .fn()
                .mockResolvedValueOnce({
                    pages: [
                        {
                            id: "page-1#0001",
                            entryId: "page-1",
                            status: statuses.draft,
                            wbyAco_location: {
                                folderId: "folder-1"
                            },
                            properties: {
                                title: "Page 1"
                            },
                            metadata: {
                                metadata: "data-1"
                            },
                            elements: {
                                element1: "element"
                            },
                            bindings: {
                                data: "any-data"
                            }
                        },
                        {
                            id: "page-2#0001",
                            entryId: "page-2",
                            status: statuses.draft,
                            wbyAco_location: {
                                folderId: "folder-1"
                            },
                            properties: {
                                title: "Page 2"
                            },
                            metadata: {
                                metadata: "data-2"
                            },
                            elements: {
                                element1: "element"
                            },
                            bindings: {
                                data: "any-data"
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: true,
                        cursor: "first",
                        totalCount: 4
                    }
                })
                .mockResolvedValueOnce({
                    pages: [
                        {
                            id: "page-3#0001",
                            entryId: "page-3",
                            status: statuses.draft,
                            wbyAco_location: {
                                folderId: "folder-2"
                            },
                            properties: {
                                title: "Page 3"
                            },
                            metadata: {
                                metadata: "data-3"
                            },
                            elements: {
                                element1: "element"
                            },
                            bindings: {
                                data: "any-data"
                            }
                        },
                        {
                            id: "page-4#0001",
                            entryId: "page-4",
                            status: statuses.draft,
                            wbyAco_location: {
                                folderId: "folder-2"
                            },
                            properties: {
                                title: "Page 4"
                            },
                            metadata: {
                                metadata: "data-4"
                            },
                            elements: {
                                element1: "element"
                            },
                            bindings: {
                                data: "any-data"
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        cursor: null,
                        totalCount: 4
                    }
                })
        };

        const listPages = ListPages.getInstance(gateway);

        expect(pagesCache.hasItems()).toBeFalse();

        // First call
        await listPages.execute({
            where: {
                wbyAco_location: {
                    folderId: "folder-1"
                }
            }
        });

        expect(gateway.execute).toHaveBeenCalledTimes(1);
        expect(gateway.execute).toHaveBeenLastCalledWith({
            where: {
                wbyAco_location: {
                    folderId: "folder-1"
                }
            },
            limit: 50
        });
        expect(pagesCache.hasItems()).toBeTrue();

        {
            const items = pagesCache.getItems();
            expect(items.length).toEqual(2);
            expect(items.map(p => p.entryId)).toEqual(["page-1", "page-2"]);
        }

        // Second call
        await listPages.execute({
            where: {
                wbyAco_location: {
                    folderId: "folder-2"
                }
            }
        });

        expect(gateway.execute).toHaveBeenCalledTimes(2);
        expect(gateway.execute).toHaveBeenLastCalledWith({
            where: {
                wbyAco_location: {
                    folderId: "folder-2"
                }
            },
            limit: 50
        });
        expect(pagesCache.hasItems()).toBeTrue();

        {
            const items = pagesCache.getItems();
            expect(items.length).toEqual(2);
            expect(items.map(p => p.entryId)).toEqual(["page-3", "page-4"]);
        }
    });

    it("should return empty array if no pages are found", async () => {
        const emptyGateway = {
            execute: jest.fn().mockResolvedValue({
                pages: [],
                meta: {
                    cursor: null,
                    totalCount: 0,
                    hasMoreItems: false
                }
            })
        };
        const listPages = ListPages.getInstance(emptyGateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await listPages.execute({
            where: {
                wbyAco_location: {
                    folderId: "folder-1"
                }
            }
        });

        expect(emptyGateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeFalse();

        const items = pagesCache.getItems();
        expect(items.length).toEqual(0);
    });

    it("should handle gateway errors gracefully", async () => {
        const errorGateway = {
            execute: jest.fn().mockRejectedValue(new Error("Gateway error"))
        };
        const listPages = ListPages.getInstance(errorGateway);

        expect(pagesCache.hasItems()).toBeFalse();

        await listPages.execute({
            where: {
                wbyAco_location: {
                    folderId: "folder-1"
                }
            }
        });

        expect(errorGateway.execute).toHaveBeenCalledTimes(1);
        expect(pagesCache.hasItems()).toBeFalse();
    });
});
