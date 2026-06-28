import { createFeature } from "@webiny/feature/api";
import { GetFlpUseCase } from "./GetFlpUseCase.js";
import { GetFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";

export const GetFlpFeature = createFeature({
    name: "GetFlpFeature",
    register(container) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new GetFlpUseCase(container.resolve(AcoFlpCrud).get);
        });
    }
});
