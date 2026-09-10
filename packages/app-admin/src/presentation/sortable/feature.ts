import { createFeature } from "@webiny/feature/admin";
import { SortablePresenter } from "./SortablePresenter.js";

export const SortableFeature = createFeature({
    name: "Sortable",
    register(container) {
        container.register(SortablePresenter);
    }
});
