import { makeAutoObservable, runInAction } from "mobx";
import {
    ListLanguagesRepository as RepositoryAbstraction,
    ListLanguagesGateway,
    LanguageDto
} from "./abstractions.js";

class ListLanguagesRepositoryImpl implements RepositoryAbstraction.Interface {
    private languages: LanguageDto[] = [];

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

        const languages = await this.gateway.execute();
        runInAction(() => {
            this.languages = languages;
        });

        return this.languages;
    }
}

export const ListLanguagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLanguagesRepositoryImpl,
    dependencies: [ListLanguagesGateway]
});
