import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { createCmsAcoContext } from "~/index";
import { createGroup } from "./mocks/group";
import { createArticleModel } from "./mocks/article.model";

jest.retryTimes(0);

const createArticleData = () => {
    return {
        title: "My article",
        smallText: "My article content",
        bigText: [
            {
                type: "p",
                content: "Some larger than usual text."
            }
        ],
        photo: "https://picsum.photos/200/300"
    };
};

describe("cms aco entry hooks", () => {
    const handler = useGraphQlHandler({
        plugins: [createGroup(), createArticleModel(), createCmsAcoContext()]
    });

    const createArticle = async () => {
        const [createResponse] = await handler.cms.createArticle({
            data: createArticleData()
        });

        return createResponse.data.createArticle.data;
    };

    let article: any;

    beforeEach(async () => {
        article = await createArticle();
    });
    /**
     * This test will validate correctly created Article record and newly created search record.
     */
    it("should create a record in aco when article is created", async () => {
        expect(article).toEqual({
            ...createArticleData(),
            meta: {
                status: "draft",
                version: 1
            },
            id: expect.any(String),
            entryId: expect.any(String)
        });

        const [response] = await handler.search.getRecord({
            id: article.id
        });

        expect(response).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: article.entryId,
                            type: "CmsEntry",
                            title: article.title,
                            content: article.smallText,
                            tags: [`model:article`],
                            location: {
                                folderId: "ROOT"
                            },
                            data: {
                                image: article.photo,
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                status: "draft",
                                version: 1,
                                locked: false
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
    /**
     * This test will validate correctly created Article record from the existing one, and updating the search record.
     */
    it("should create a record in aco when a new article is created from the existing one", async () => {
        const [createFromResponse] = await handler.cms.createArticleFrom({
            id: article.id
        });
        expect(createFromResponse).toEqual({
            data: {
                createArticleFrom: {
                    data: {
                        ...article,
                        id: `${article.entryId}#0002`,
                        meta: {
                            status: "draft",
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        const [response] = await handler.search.getRecord({
            id: article.id
        });

        expect(response).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: article.entryId,
                            type: "CmsEntry",
                            title: article.title,
                            content: article.smallText,
                            tags: [`model:article`],
                            location: {
                                folderId: "ROOT"
                            },
                            data: {
                                image: article.photo,
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                status: "draft",
                                version: 2,
                                locked: false
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
    /**
     * This test will validate updating the article and updating the search record.
     */
    it("should update a record in aco when article record updates", async () => {
        const updatedData = {
            title: "My article updated",
            smallText: "My article content updated",
            photo: "https://picsum.photos/200/300?updated"
        };
        const [updateResponse] = await handler.cms.updateArticle({
            revision: article.id,
            data: {
                ...createArticleData(),
                ...updatedData
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateArticle: {
                    data: {
                        ...updatedData,
                        id: article.id
                    },
                    error: null
                }
            }
        });
        const [response] = await handler.search.getRecord({
            id: article.entryId
        });

        expect(response).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: article.entryId,
                            type: "CmsEntry",
                            title: updatedData.title,
                            content: updatedData.smallText,
                            tags: [`model:article`],
                            location: {
                                folderId: "ROOT"
                            },
                            data: {
                                image: updatedData.photo,
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                status: "draft",
                                version: 1,
                                locked: false
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
    /**
     * This test will validate updating the search record when the article is published.
     */
    it("should update a record in aco when article is published", async () => {
        const [publishResponse] = await handler.cms.publishArticle({
            id: article.id
        });
        expect(publishResponse).toMatchObject({
            data: {
                publishArticle: {
                    data: {
                        id: article.id,
                        meta: {
                            status: "published"
                        }
                    },
                    error: null
                }
            }
        });

        const [response] = await handler.search.getRecord({
            id: article.id
        });

        expect(response).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: article.entryId,
                            type: "CmsEntry",
                            title: article.title,
                            content: article.smallText,
                            tags: [`model:article`],
                            location: {
                                folderId: "ROOT"
                            },
                            data: {
                                image: article.photo,
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                status: "published",
                                version: 1,
                                locked: true
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });

    /**
     * This test will validate updating the search record when the article is unpublished.
     */
    it("should update a record in aco when article is unpublished", async () => {
        await handler.cms.publishArticle({
            id: article.id
        });

        const [unpublishResponse] = await handler.cms.unpublishArticle({
            id: article.id
        });
        expect(unpublishResponse).toMatchObject({
            data: {
                unpublishArticle: {
                    data: {
                        id: article.id,
                        meta: {
                            status: "unpublished"
                        }
                    },
                    error: null
                }
            }
        });

        const [response] = await handler.search.getRecord({
            id: article.entryId
        });

        expect(response).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: {
                            id: article.entryId,
                            type: "CmsEntry",
                            title: article.title,
                            content: article.smallText,
                            tags: [`model:article`],
                            location: {
                                folderId: "ROOT"
                            },
                            data: {
                                image: article.photo,
                                createdBy: {
                                    id: "12345678",
                                    displayName: "John Doe",
                                    type: "admin"
                                },
                                createdOn: expect.any(String),
                                savedOn: expect.any(String),
                                status: "unpublished",
                                version: 1,
                                locked: true
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
    /**
     * This test will validate the deletion of the article and the deletion of the search record.
     */
    it("should delete a record in aco when article is deleted", async () => {
        const [deleteResponse] = await handler.cms.deleteArticle({
            id: article.id
        });
        expect(deleteResponse).toEqual({
            data: {
                deleteArticle: {
                    data: true,
                    error: null
                }
            }
        });
        const [response] = await handler.search.getRecord({
            id: article.entryId
        });

        expect(response).toEqual({
            data: {
                search: {
                    getRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: {
                                id: article.entryId
                            },
                            message: "Record not found."
                        }
                    }
                }
            }
        });
    });
});
