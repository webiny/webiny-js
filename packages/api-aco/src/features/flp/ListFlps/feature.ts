import { createFeature } from "@webiny/feature/api";
import { ListFlpsUseCase } from "./ListFlpsUseCase.js";
import { ListFlpsUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoContext } from "~/types.js";

export const ListFlpsFeature = createFeature<AcoContext["aco"]["flp"]>({
    name: "ListFlpsFeature",
    register(container, context) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new ListFlpsUseCase(context.list);
        });
    }
});
