import Error from "@webiny/error";
import { Context } from "../types";
import { CmsSchemaClient } from "../CmsSchemaClient";
import { ReadonlyArticle, Translation } from "@demo/shared";
import { getEntryId } from "../getEntryId";

interface GetTranslationsQueryResponse {
    listArticles: {
        data: Array<{
            slug: string;
            language: {
                id: string;
            };
        }>;
        error: {
            code: string;
            message: string;
            data: Record<string, any>;
        };
    };
}

export interface IGetArticleTranslationsUseCase {
    execute(article: ReadonlyArticle): Promise<Translation[]>;
}

export class GetArticleTranslations implements IGetArticleTranslationsUseCase {
    private readonly context: Context;
    private cmsClient: CmsSchemaClient;

    constructor(context: Context) {
        this.context = context;
        this.cmsClient = new CmsSchemaClient(this.context);
    }

    async execute(article: ReadonlyArticle) {
        const variables = {
            region: getEntryId(article.region!.id),
            translationBase: getEntryId(article.id)
        };

        if (article.translationBase) {
            variables.translationBase = getEntryId(article.translationBase.id);
        }

        const { data } = await this.cmsClient.read<GetTranslationsQueryResponse>({
            query: GET_TRANSLATIONS,
            operationName: "GetTranslations",
            variables
        });

        if (data.listArticles.error) {
            throw new Error(data?.listArticles.error);
        }

        return data.listArticles.data.map<Translation>(article => {
            return {
                languageId: getEntryId(article.language.id),
                articleSlug: article.slug
            };
        });
    }
}

const GET_TRANSLATIONS = /* GraphQL */ `
    query GetTranslations($region: String, $translationBase: String) {
        listArticles(
            where: {
                region: { entryId: $region }
                AND: [
                    {
                        OR: [
                            { translationBase: { entryId: $translationBase } }
                            { entryId: $translationBase }
                        ]
                    }
                ]
            }
        ) {
            data {
                slug
                language {
                    id
                }
            }
            error {
                code
                message
                data
            }
        }
    }
`;
