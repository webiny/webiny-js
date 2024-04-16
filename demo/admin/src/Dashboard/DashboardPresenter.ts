import { makeAutoObservable } from "mobx";
import { IArticlesRepository } from "./Abstractions/IArticlesRepository";
import { ReadonlyArticle } from "@demo/shared";

export class DashboardPresenter {
    private articlesRepository: IArticlesRepository;
    private previewArticle: ReadonlyArticle | undefined;

    constructor(articlesRepository: IArticlesRepository) {
        this.articlesRepository = articlesRepository;
        this.previewArticle = undefined;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            previewArticle: this.previewArticle,
            articles: this.articlesRepository.getArticles(),
            meta: this.articlesRepository.getArticlesMeta(),
            isListLoading: this.articlesRepository.getLoading().isLoading
        };
    }

    showArticlePreview(article: ReadonlyArticle) {
        this.previewArticle = article;
    }

    hideArticlePreview() {
        this.previewArticle = undefined;
    }

    setSearch = (query: string) => {
        this.articlesRepository.listArticles({ search: query });
    };

    init() {
        this.articlesRepository.listArticles();
    }
}
