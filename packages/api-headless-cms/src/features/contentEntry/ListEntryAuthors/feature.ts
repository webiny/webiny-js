import { createFeature } from "@webiny/feature/api";
import { ListEntryAuthorsUseCase } from "./ListEntryAuthorsUseCase.js";

export const ListEntryAuthorsFeature = createFeature({
    name: "ListEntryAuthors",
    register(container) {
        container.register(ListEntryAuthorsUseCase);
    }
});
