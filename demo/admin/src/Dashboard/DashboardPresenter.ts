import { makeAutoObservable } from "mobx";
import { IArticlesRepository } from "./Abstractions/IArticlesRepository";

export class DashboardPresenter {
    private articlesRepository: IArticlesRepository;

    constructor(articlesRepository: IArticlesRepository) {
        this.articlesRepository = articlesRepository;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            articles: this.articlesRepository.getArticles(),
            meta: this.articlesRepository.getArticlesMeta(),
            isListLoading: this.articlesRepository.getLoading().isLoading
        };
    }

    setSearch = (query: string) => {
        this.articlesRepository.listArticles({ search: query });
    }

    init() {
        this.articlesRepository.listArticles();
    }
}
