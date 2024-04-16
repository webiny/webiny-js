import {
    ErrorResponse,
    GraphQLSchemaPlugin,
    ListResponse,
    Response
} from "@webiny/handler-graphql";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";
import { createArticlesTypeDefs } from "./createArticlesTypeDefs";
import { createCmsArticlesTypeDefs } from "./createCmsArticlesTypeDefs";
import { ArticleCloneOpts, ArticlesListOpts, Context } from "../types";
import { ListArticles } from "../useCases/ListArticles";
import { ContextualArticlesFiltering } from "../useCases/ContextualArticlesFiltering";
import { CloneArticle } from "../useCases/CloneArticle";
import { GetArticleTranslations } from "../useCases/GetArticleTranslations";
import { ReadonlyArticle } from "@demo/shared";
import { ContextPlugin } from "@webiny/api";

export const createArticlesSchema = () => {
    const demoGraphQL = new GraphQLSchemaPlugin<Context>({
        typeDefs: createArticlesTypeDefs(),
        resolvers: {
            DemoQuery: {
                /**
                 * This resolver will filter content using company rules (culture groups, exclusion lists, regions).
                 */
                async listArticles(_, args, context) {
                    const { where, ...input } = args as ArticlesListOpts;

                    if (where?.region) {
                        where.region = { entryId: where.region };
                    }

                    if (where?.language) {
                        where.language = { entryId: where.language };
                    }

                    try {
                        //  Switch to root tenant, as this query can be executed from different tenant contexts.
                        return context.tenancy.withRootTenant(() => {
                            return context.security.withoutAuthorization(async () => {
                                const baseUseCase = new ListArticles(context);
                                const withFiltering = new ContextualArticlesFiltering(
                                    context,
                                    baseUseCase
                                );
                                const { data, meta } = await withFiltering.execute({
                                    ...input,
                                    where,
                                    includeContent: false
                                });

                                return new ListResponse(data, meta);
                            });
                        });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                },
                async getArticle(_, args, context) {
                    try {
                        return context.security.withoutAuthorization(async () => {
                            const baseUseCase = new ListArticles(context);
                            const withFiltering = new ContextualArticlesFiltering(
                                context,
                                baseUseCase
                            );

                            const { data } = await withFiltering.execute({
                                limit: 1,
                                where: {
                                    slug: args.where.slug,
                                    region: {
                                        entryId: args.where.region
                                    },
                                    language: {
                                        entryId: args.where.language
                                    }
                                },
                                includeContent: true
                            });

                            if (data.length < 1) {
                                return new ErrorResponse({
                                    code: "ARTICLE_NOT_FOUND",
                                    message: `Article "${args.where.slug}" was not found for the requested region and language!`
                                });
                            }

                            const article = data[0] as ReadonlyArticle;
                            const getTranslations = new GetArticleTranslations(context);
                            const translations = await getTranslations.execute(article);

                            return new Response({ ...article, translations });
                        });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    demoGraphQL.name = "demo.graphql.articles";

    const demoCmsGraphQL = new CmsGraphQLSchemaPlugin<Context>({
        typeDefs: createCmsArticlesTypeDefs(),
        resolvers: {
            Mutation: {
                async cloneArticle(_, args, context) {
                    try {
                        const cloneArticleUseCase = new CloneArticle(context);
                        const entry = await cloneArticleUseCase.execute(args as ArticleCloneOpts);

                        return new Response(entry);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    });
    demoGraphQL.name = "demo.cms.graphql.articles";

    return new ContextPlugin<Context>(context => {
        if (context.tenancy.getCurrentTenant().id !== "root") {
            context.plugins.register(demoGraphQL);
            return;
        }

        context.plugins.register(demoGraphQL, demoCmsGraphQL);
    });
};
