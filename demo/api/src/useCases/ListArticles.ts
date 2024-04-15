import Error from "@webiny/error";
import { Context } from "../types";
import { CmsSchemaClient } from "../CmsSchemaClient";

export type ArticleData = Record<string, any>;
export type ArticlesMeta = {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
};

export type ListArticlesReturn = {
    data: ArticleData[];
    meta: ArticlesMeta;
};

type ListArticlesQueryResponse = {
    listArticles: {
        data: ArticleData[] | undefined;
        meta: ArticlesMeta | undefined;
        error:
            | {
                  code: string;
                  message: string;
                  data: Record<string, any>;
                  stack: string;
              }
            | undefined;
    };
};

export interface ListArticlesParams {
    search?: string;
    after?: string;
    limit?: number;
    where?: Record<string, any>;
    includeContent: boolean;
}

export interface IListArticlesUseCase {
    execute(params: ListArticlesParams): Promise<ListArticlesReturn>;
}

export class ListArticles implements IListArticlesUseCase {
    private readonly context: Context;
    constructor(context: Context) {
        this.context = context;
    }

    async execute(params: ListArticlesParams) {
        return this.listArticles(params);
    }

    private async listArticles(params: ListArticlesParams): Promise<ListArticlesReturn> {
        const cmsClient = new CmsSchemaClient(this.context);

        const { data } = await cmsClient.read<ListArticlesQueryResponse>({
            query: LIST_ARTICLES,
            operationName: "ListArticles",
            variables: params
        });

        if (data.listArticles.error) {
            throw new Error(data?.listArticles.error);
        }

        return {
            data: data.listArticles.data!,
            meta: data.listArticles.meta!
        };
    }
}

const LIST_ARTICLES = /* GraphQL */ `
    query ListArticles(
        $limit: Int
        $after: String
        $search: String
        $where: ArticleListWhereInput
        $includeContent: Boolean!
    ) {
        listArticles(limit: $limit, after: $after, search: $search, where: $where) {
            data {
                id
                title
                slug
                description
                region {
                    id
                    title
                }
                language {
                    id
                    name
                    slug
                }
                heroImage {
                    image
                    cultureGroup {
                        id
                        title
                        description
                    }
                }
                content @include(if: $includeContent) {
                    ... on Article_Content_Richtextfield {
                        content
                        __typename
                    }
                    ... on Article_Content_Hero {
                        title
                        subtitle
                        description
                        image
                        callToActionButtonLabel
                        callToActionButtonUrl
                        __typename
                    }
                    ... on Article_Content_ThreeGridBox {
                        boxes {
                            title
                            description
                            icon
                        }
                        __typename
                    }
                    ... on Article_Content_Banner {
                        title
                        actionUrl
                        actionLabel
                        image
                        __typename
                    }
                    ... on Article_Content_Textwithimageblock {
                        title
                        content
                        image
                        __typename
                    }
                }
                seoTitle
                seoDescription
                seoMetaTags {
                    tagName
                    tagValue
                }
            }
            meta {
                cursor
                totalCount
                hasMoreItems
            }
        }
    }
`;
