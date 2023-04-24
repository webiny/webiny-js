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
    it("should create a record in aco", async () => {
        expect(article).toEqual({
            ...createArticleData(),
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
     * This test will validate updating the article and updating the search record.
     */
    it("should update a record in aco", async () => {
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
    });
});
