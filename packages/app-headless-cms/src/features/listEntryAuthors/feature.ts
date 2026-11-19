import { createFeature } from "@webiny/feature/admin";
import { ListEntryAuthorsUseCase as UseCase } from "./abstractions.js";
import { ListEntryAuthorsUseCase } from "./ListEntryAuthorsUseCase.js";
import { ListEntryAuthorsGateway } from "./ListEntryAuthorsGateway.js";

export const ListEntryAuthorsFeature = createFeature({
    name: "CmsListEntryAuthors",
    register(container) {
        container.register(ListEntryAuthorsUseCase);
        container.register(ListEntryAuthorsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
