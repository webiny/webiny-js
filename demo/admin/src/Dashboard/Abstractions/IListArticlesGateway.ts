import { ListResponseMeta, ReadonlyArticle } from "@demo/shared";

export interface ListArticlesReturn {
    data: Array<ReadonlyArticle>;
    meta: ListResponseMeta;
}

export interface ListArticlesParams {
    limit?: number;
    search?: string;
    after?: string;
}

export interface IListArticlesGateway {
    execute(params: ListArticlesParams): Promise<ListArticlesReturn>;
}
