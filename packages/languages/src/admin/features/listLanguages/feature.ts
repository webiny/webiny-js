import { createFeature } from "@webiny/feature/admin";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import {
    ListLanguagesUseCase as UseCaseAbstraction,
    ListLanguagesRepository as RepositoryAbstraction,
    LanguagesCache
} from "./abstractions.js";
import type { LanguageDto } from "./abstractions.js";
import { ListLanguagesUseCase } from "./ListLanguagesUseCase.js";
import { ListLanguagesRepository } from "./ListLanguagesRepository.js";
import { ListLanguagesGateway } from "./ListLanguagesGateway.js";
import { LanguageEntryAfterCreateHandler } from "./LanguageEntryAfterCreateHandler.js";
import { LanguageEntryAfterUpdateHandler } from "./LanguageEntryAfterUpdateHandler.js";
import { LanguageEntryAfterDeleteHandler } from "./LanguageEntryAfterDeleteHandler.js";

export const ListLanguagesFeature = createFeature({
    name: "Languages/ListLanguages",
    register(container) {
        container.registerInstance(LanguagesCache, new ListCache<LanguageDto>());
        container.register(ListLanguagesUseCase);
        container.register(ListLanguagesRepository).inSingletonScope();
        container.register(ListLanguagesGateway).inSingletonScope();
        container.register(LanguageEntryAfterCreateHandler);
        container.register(LanguageEntryAfterUpdateHandler);
        container.register(LanguageEntryAfterDeleteHandler);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction),
            repository: container.resolve(RepositoryAbstraction),
            cache: container.resolve(LanguagesCache)
        };
    }
});
