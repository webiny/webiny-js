import { makeAutoObservable, runInAction } from "mobx";
import {
    ListLanguagesRepository as RepositoryAbstraction,
    ListLanguagesGateway,
    type LanguageDto
} from "./abstractions.js";

class ListLanguagesRepositoryImpl implements RepositoryAbstraction.Interface {
    private languages: LanguageDto[] = [];
    private pending: Promise<LanguageDto[]> | undefined;

    constructor(private gateway: ListLanguagesGateway.Interface) {
        makeAutoObservable(this);
    }

    getLanguages(): LanguageDto[] {
        return this.languages;
    }

    async execute(): Promise<LanguageDto[]> {
        if (this.languages.length > 0) {
            return this.languages;
        }

        if (this.pending) {
            return this.pending;
        }

        this.pending = this.gateway.execute().then(languages => {
            runInAction(() => {
                this.languages = languages.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
            });
            return this.languages;
        });

        return this.pending;
    }
}

export const ListLanguagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLanguagesRepositoryImpl,
    dependencies: [ListLanguagesGateway]
});
