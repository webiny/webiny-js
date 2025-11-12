import { createFeature } from "@webiny/feature/api";
import { GetUniqueFieldValuesUseCase } from "./GetUniqueFieldValuesUseCase.js";
import { GetUniqueFieldValuesRepository } from "./GetUniqueFieldValuesRepository.js";

export const GetUniqueFieldValuesFeature = createFeature({
    name: "GetUniqueFieldValues",
    register(container) {
        container.register(GetUniqueFieldValuesUseCase);
        container.register(GetUniqueFieldValuesRepository).inSingletonScope();
    }
});
