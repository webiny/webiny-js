import {
    ListLanguagesRepository as RepositoryAbstraction,
    ListLanguagesGateway,
    LanguagesCache,
    type LanguageDto
} from "./abstractions.js";

class ListLanguagesRepositoryImpl implements RepositoryAbstraction.Interface {
    private pending: Promise<LanguageDto[]> | undefined;

    constructor(
        private gateway: ListLanguagesGateway.Interface,
        private cache: LanguagesCache.Interface
    ) {}

    getLanguages(): LanguageDto[] {
        return this.cache.getItems();
    }

    async execute(): Promise<LanguageDto[]> {
        if (this.cache.hasItems()) {
            return this.cache.getItems();
        }

        if (this.pending) {
            return this.pending;
        }

        this.pending = this.gateway.execute().then(languages => {
            const sorted = languages.sort((a, b) => a.name.localeCompare(b.name));
            this.cache.addItems(sorted);
            return this.cache.getItems();
        });

        return this.pending;
    }
}

export const ListLanguagesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListLanguagesRepositoryImpl,
    dependencies: [ListLanguagesGateway, LanguagesCache]
});
