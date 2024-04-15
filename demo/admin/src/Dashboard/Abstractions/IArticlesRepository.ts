import { ReadonlyArticle } from "@demo/shared";
import { Loading } from "../Loading";

export interface ListArticlesParams {
    limit?: number;
    search?: string;
    after?: string;
}

export interface ArticlesMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface IArticlesRepository {
    getArticles(): ReadonlyArticle[];
    getArticlesMeta(): ArticlesMeta;
    getLoading(): Loading;
    listArticles(params?: ListArticlesParams): Promise<void>;
}
