import { createFeature } from "@webiny/feature/api";
import { ListFlpsUseCase } from "./ListFlpsUseCase.js";
import { ListFlpsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";

export const ListFlpsFeature = createFeature({
    name: "ListFlpsFeature",
    register(container) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new ListFlpsUseCase(container.resolve(AcoFlpCrud).list);
        });
    }
});
