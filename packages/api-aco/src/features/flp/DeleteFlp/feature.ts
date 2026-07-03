import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { DeleteFlpUseCase } from "./DeleteFlpUseCase.js";
import { DeleteFlpUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";

export const DeleteFlpFeature = createFeature({
    name: "DeleteFlp",
    register(container: Container) {
        container.registerFactory(UseCaseAbstraction, () => {
            return new DeleteFlpUseCase(container.resolve(AcoFlpCrud));
        });
    }
});
