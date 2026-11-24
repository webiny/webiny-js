import { createFeature } from "@webiny/feature/api";
import { ListFlpsUseCase } from "./ListFlpsUseCase.js";

export const ListFlpsFeature = createFeature({
    name: "ListFlpsFeature",
    register(container) {
        container.register(ListFlpsUseCase);
    }
});
