import { createFeature } from "@webiny/feature/api";
import { GetRedirectByIdRepository } from "./GetRedirectByIdRepository.js";
import { GetRedirectByIdUseCase } from "./GetRedirectByIdUseCase.js";

export const GetRedirectByIdFeature = createFeature({
    name: "WebsiteBuilder/GetRedirectById",
    register(container) {
        container.register(GetRedirectByIdRepository).inSingletonScope();
        container.register(GetRedirectByIdUseCase);
    }
});
