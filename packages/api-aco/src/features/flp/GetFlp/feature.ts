import { createFeature } from "@webiny/feature/api";
import { GetFlpUseCase } from "./GetFlpUseCase.js";
import { GetFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { AcoContext } from "~/types.js";

export const GetFlpFeature = createFeature<AcoContext["aco"]["flp"]>({
    name: "GetFlpFeature",
    register(container, context) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new GetFlpUseCase(context.get);
        });
    }
});
