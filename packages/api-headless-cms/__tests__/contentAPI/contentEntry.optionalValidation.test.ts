import { useProductManageHandler } from "~tests/testHelpers/useProductManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useProductReadHandler } from "~tests/testHelpers/useProductReadHandler";

describe("optional validation of the content entry values", () => {
    const manager = useProductManageHandler({
        path: "manage/en-US"
    });
    const reader = useProductReadHandler({
        path: "read/en-US"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["product", "category"]
        });
    });

    it("should store a new content entry without validating the values", async () => {
        const [response] = await manager.createProduct({
            data: {
                title: "",
                category: {
                    modelId: "",
                    id: ""
                },
                variant: {
                    category: {
                        modelId: "",
                        id: ""
                    },
                    options: {
                        category: {
                            modelId: "",
                            id: ""
                        },
                        categories: [
                            {
                                modelId: "",
                                id: ""
                            },
                            {
                                modelId: "",
                                id: ""
                            }
                        ]
                    }
                },
                price: 0,
                color: "",
                image: ""
            },
            options: {
                validate: false
            }
        });
        expect(response).toEqual({
            data: {
                createProduct: {
                    data: {
                        availableOn: null,
                        availableSizes: [],
                        category: null,
                        color: "",
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.any(String),
                        entryId: expect.any(String),
                        id: expect.stringMatching(/#0001$/),
                        image: "",
                        inStock: null,
                        itemsInStock: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title: ""
                                }
                            ],
                            status: "draft",
                            title: expect.any(String),
                            version: 1
                        },
                        price: 0,
                        richText: null,
                        savedOn: expect.any(String),
                        title: "",
                        variant: {
                            category: null,
                            images: [],
                            name: null,
                            options: [
                                {
                                    categories: [],
                                    category: null,
                                    image: "",
                                    longText: null,
                                    name: null,
                                    price: null
                                }
                            ],
                            price: null
                        }
                    },
                    error: null
                }
            }
        });
        const revision = response.data.createProduct.data.id;
        const [getResponse] = await manager.getProduct({
            revision
        });
        expect(getResponse).toEqual({
            data: {
                getProduct: {
                    data: {
                        availableOn: null,
                        availableSizes: [],
                        category: null,
                        color: "",
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.any(String),
                        entryId: expect.any(String),
                        id: expect.stringMatching(/#0001$/),
                        image: "",
                        inStock: null,
                        itemsInStock: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title: ""
                                }
                            ],
                            status: "draft",
                            title: expect.stringMatching(/#0001$/),
                            version: 1
                        },
                        price: 0,
                        richText: null,
                        savedOn: expect.any(String),
                        title: "",
                        variant: {
                            category: null,
                            images: [],
                            name: "",
                            options: [
                                {
                                    categories: [],
                                    category: null,
                                    image: "",
                                    longText: [],
                                    name: "",
                                    price: null
                                }
                            ],
                            price: null
                        }
                    },
                    error: null
                }
            }
        });
    });

    it("should create a new content entry from existing content entry without validating the values", async () => {
        const [createResponse] = await manager.createProduct({
            data: {
                title: "A Product",
                category: {
                    modelId: "",
                    id: ""
                },
                variant: {
                    category: {
                        modelId: "",
                        id: ""
                    },
                    options: {
                        category: {
                            modelId: "",
                            id: ""
                        },
                        categories: [
                            {
                                modelId: "",
                                id: ""
                            },
                            {
                                modelId: "",
                                id: ""
                            }
                        ]
                    }
                },
                price: 0,
                color: "",
                image: ""
            },
            options: {
                validate: false
            }
        });
        expect(createResponse).toMatchObject({
            data: {
                createProduct: {
                    data: {
                        title: "A Product"
                    },
                    error: null
                }
            }
        });
        expect(createResponse.errors).toBeUndefined();
        const revision = createResponse.data.createProduct.data.id;
        const [getResponse] = await manager.getProduct({
            revision
        });
        expect(getResponse).toEqual({
            data: {
                getProduct: {
                    data: {
                        availableOn: null,
                        availableSizes: [],
                        category: null,
                        color: "",
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.any(String),
                        entryId: expect.any(String),
                        id: expect.stringMatching(/#0001$/),
                        image: "",
                        inStock: null,
                        itemsInStock: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title: "A Product"
                                }
                            ],
                            status: "draft",
                            title: "A Product",
                            version: 1
                        },
                        price: 0,
                        richText: null,
                        savedOn: expect.any(String),
                        title: "A Product",
                        variant: {
                            category: null,
                            images: [],
                            name: "",
                            options: [
                                {
                                    categories: [],
                                    category: null,
                                    image: "",
                                    longText: [],
                                    name: "",
                                    price: null
                                }
                            ],
                            price: null
                        }
                    },
                    error: null
                }
            }
        });

        const [createFromResponse] = await manager.createProductFrom({
            revision,
            data: {
                title: "",
                category: {
                    modelId: "",
                    id: ""
                },
                variant: {
                    category: {
                        modelId: "",
                        id: ""
                    },
                    options: {
                        category: {
                            modelId: "",
                            id: ""
                        },
                        categories: [
                            {
                                modelId: "",
                                id: ""
                            },
                            {
                                modelId: "",
                                id: ""
                            }
                        ]
                    }
                },
                price: 0,
                color: "",
                image: ""
            },
            options: {
                validate: false
            }
        });
        expect(createFromResponse).toEqual({
            data: {
                createProductFrom: {
                    data: {
                        availableOn: null,
                        availableSizes: [],
                        category: null,
                        color: "",
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.any(String),
                        entryId: expect.any(String),
                        id: expect.stringMatching(/#0002$/),
                        image: "",
                        inStock: null,
                        itemsInStock: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.stringMatching(/#0002$/),
                                    title: ""
                                },
                                {
                                    id: expect.stringMatching(/#0001$/),
                                    title: "A Product"
                                }
                            ],
                            status: "draft",
                            title: expect.stringMatching(/#0002$/),
                            version: 2
                        },
                        price: 0,
                        richText: null,
                        savedOn: expect.any(String),
                        title: "",
                        variant: {
                            category: null,
                            images: [],
                            name: null,
                            options: [
                                {
                                    categories: [],
                                    category: null,
                                    image: "",
                                    longText: null,
                                    name: null,
                                    price: null
                                }
                            ],
                            price: null
                        }
                    },
                    error: null
                }
            }
        });
        const [getSecondRevisionResponse] = await manager.getProduct({
            revision: createFromResponse.data.createProductFrom.data.id
        });
        expect(getSecondRevisionResponse).toEqual({
            data: {
                getProduct: {
                    data: {
                        availableOn: null,
                        availableSizes: [],
                        category: null,
                        color: "",
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.any(String),
                        entryId: expect.any(String),
                        id: expect.stringMatching(/#0002$/),
                        image: "",
                        inStock: null,
                        itemsInStock: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.stringMatching(/#0002$/),
                                    title: ""
                                },
                                {
                                    id: expect.stringMatching(/#0001$/),
                                    title: "A Product"
                                }
                            ],
                            status: "draft",
                            title: expect.stringMatching(/#0002$/),
                            version: 2
                        },
                        price: 0,
                        richText: null,
                        savedOn: expect.any(String),
                        title: "",
                        variant: {
                            category: null,
                            images: [],
                            name: "",
                            options: [
                                {
                                    categories: [],
                                    category: null,
                                    image: "",
                                    longText: [],
                                    name: "",
                                    price: null
                                }
                            ],
                            price: null
                        }
                    },
                    error: null
                }
            }
        });

        const [listResponse] = await manager.listProducts();
        expect(listResponse).toEqual({
            data: {
                listProducts: {
                    data: [
                        {
                            availableOn: null,
                            availableSizes: [],
                            category: null,
                            color: "",
                            createdBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            createdOn: expect.any(String),
                            entryId: expect.any(String),
                            id: expect.stringMatching(/#0002$/),
                            image: "",
                            inStock: null,
                            itemsInStock: null,
                            meta: {
                                locked: false,
                                modelId: "product",
                                publishedOn: null,
                                revisions: [
                                    {
                                        id: expect.stringMatching(/#0002$/),
                                        title: ""
                                    },
                                    {
                                        id: expect.stringMatching(/#0001$/),
                                        title: "A Product"
                                    }
                                ],
                                status: "draft",
                                title: expect.stringMatching(/#0002$/),
                                version: 2
                            },
                            price: 0,
                            richText: null,
                            savedOn: expect.any(String),
                            title: "",
                            variant: {
                                category: null,
                                images: [],
                                name: "",
                                options: [
                                    {
                                        categories: [],
                                        category: null,
                                        image: "",
                                        longText: [],
                                        name: "",
                                        price: null
                                    }
                                ],
                                price: null
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });

        const [readGetResponse] = await reader.getProduct({
            where: {
                entryId: createFromResponse.data.createProductFrom.data.entryId
            }
        });
        expect(readGetResponse).toEqual({
            data: {
                getProduct: {
                    data: null,
                    error: {
                        message: "Entry not found!",
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });

        const [readListResponse] = await reader.listProducts();
        expect(readListResponse).toEqual({
            data: {
                listProducts: {
                    data: [],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 0,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should update a content entry without validating the values", async () => {
        const [createResponse] = await manager.createProduct({
            data: {
                title: "A Product",
                category: {
                    modelId: "",
                    id: ""
                },
                variant: {
                    category: {
                        modelId: "",
                        id: ""
                    },
                    options: {
                        category: {
                            modelId: "",
                            id: ""
                        },
                        categories: [
                            {
                                modelId: "",
                                id: ""
                            },
                            {
                                modelId: "",
                                id: ""
                            }
                        ]
                    }
                },
                price: 100,
                color: "red",
                image: "https://webiny.com/image.png"
            },
            options: {
                validate: false
            }
        });
        const entry = createResponse.data.createProduct.data;

        const [updateResponse] = await manager.updateProduct({
            revision: entry.id,
            data: {
                title: "",
                category: {
                    modelId: "",
                    id: ""
                },
                variant: {
                    category: {
                        modelId: "",
                        id: ""
                    },
                    options: {
                        category: {
                            modelId: "",
                            id: ""
                        },
                        categories: [
                            {
                                modelId: "",
                                id: ""
                            },
                            {
                                modelId: "",
                                id: ""
                            }
                        ]
                    }
                },
                price: 0,
                color: "",
                image: ""
            },
            options: {
                validate: false
            }
        });
        expect(updateResponse).toEqual({
            data: {
                updateProduct: {
                    data: {
                        availableOn: null,
                        availableSizes: [],
                        category: null,
                        color: "",
                        createdBy: {
                            displayName: "John Doe",
                            id: "id-12345678",
                            type: "admin"
                        },
                        createdOn: expect.any(String),
                        entryId: expect.any(String),
                        id: expect.stringMatching(/#0001$/),
                        image: "",
                        inStock: null,
                        itemsInStock: null,
                        meta: {
                            locked: false,
                            modelId: "product",
                            publishedOn: null,
                            revisions: [
                                {
                                    id: expect.any(String),
                                    title: ""
                                }
                            ],
                            status: "draft",
                            title: expect.stringMatching(/#0001$/),
                            version: 1
                        },
                        price: 0,
                        richText: null,
                        savedOn: expect.any(String),
                        title: "",
                        variant: {
                            category: null,
                            images: [],
                            name: null,
                            options: [
                                {
                                    categories: [],
                                    category: null,
                                    image: "",
                                    longText: null,
                                    name: null,
                                    price: null
                                }
                            ],
                            price: null
                        }
                    },
                    error: null
                }
            }
        });

        const [listResponse] = await manager.listProducts();
        expect(listResponse).toEqual({
            data: {
                listProducts: {
                    data: [
                        {
                            availableOn: null,
                            availableSizes: [],
                            category: null,
                            color: "",
                            createdBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            createdOn: expect.any(String),
                            entryId: expect.any(String),
                            id: expect.stringMatching(/#0001$/),
                            image: "",
                            inStock: null,
                            itemsInStock: null,
                            meta: {
                                locked: false,
                                modelId: "product",
                                publishedOn: null,
                                revisions: [
                                    {
                                        id: expect.stringMatching(/#0001$/),
                                        title: ""
                                    }
                                ],
                                status: "draft",
                                title: expect.stringMatching(/#0001$/),
                                version: 1
                            },
                            price: 0,
                            richText: null,
                            savedOn: expect.any(String),
                            title: "",
                            variant: {
                                category: null,
                                images: [],
                                name: "",
                                options: [
                                    {
                                        categories: [],
                                        category: null,
                                        image: "",
                                        longText: [],
                                        name: "",
                                        price: null
                                    }
                                ],
                                price: null
                            }
                        }
                    ],
                    meta: {
                        hasMoreItems: false,
                        totalCount: 1,
                        cursor: null
                    },
                    error: null
                }
            }
        });
    });

    it("should not allow to publish an entry which does not pass the validation", async () => {
        const [createResponse] = await manager.createProduct({
            data: {
                title: "A Product",
                category: {
                    modelId: "",
                    id: ""
                },
                variant: {
                    category: {
                        modelId: "",
                        id: ""
                    },
                    options: {
                        category: {
                            modelId: "",
                            id: ""
                        },
                        categories: [
                            {
                                modelId: "",
                                id: ""
                            },
                            {
                                modelId: "",
                                id: ""
                            }
                        ]
                    }
                },
                price: 100,
                color: "red",
                image: "https://webiny.com/image.png"
            },
            options: {
                validate: false
            }
        });
        const entry = createResponse.data.createProduct.data;

        const [publishResponse] = await manager.publishProduct({
            revision: entry.id
        });
        expect(publishResponse).toEqual({
            data: {
                publishProduct: {
                    data: null,
                    error: {
                        message: "Validation failed.",
                        code: "VALIDATION_FAILED",
                        data: [
                            {
                                error: "Please select a category",
                                fieldId: "category",
                                storageId: "ref@category"
                            }
                        ]
                    }
                }
            }
        });
    });
});
