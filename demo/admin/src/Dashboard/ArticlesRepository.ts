import { makeAutoObservable, runInAction } from "mobx";
import {
    ArticlesMeta,
    IArticlesRepository,
    ListArticlesParams
} from "./Abstractions/IArticlesRepository";
import { IListArticlesGateway } from "./Abstractions/IListArticlesGateway";
import { ReadonlyArticle } from "@demo/shared";
import { Loading } from "./Loading";

export class ArticlesRepository implements IArticlesRepository {
    private gateway: IListArticlesGateway;
    private loading = new Loading();
    private articles: ReadonlyArticle[] = [];
    private articlesMeta: ArticlesMeta = {
        cursor: null,
        totalCount: 0,
        hasMoreItems: false
    };

    constructor(gateway: IListArticlesGateway) {
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    getArticles(): ReadonlyArticle[] {
        return this.articles;
    }

    getArticlesMeta(): ArticlesMeta {
        return this.articlesMeta;
    }

    getLoading(): Loading {
        return this.loading;
    }

    async listArticles(params: ListArticlesParams = {}): Promise<void> {
        const result = await this.loading.runCallbackWithLoading(() =>
            this.gateway.execute(params)
        );

        runInAction(() => {
            this.articles = result.data;
            this.articlesMeta = result.meta;
        });
    }
}
