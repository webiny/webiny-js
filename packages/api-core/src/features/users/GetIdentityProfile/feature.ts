import { createFeature } from "@webiny/feature/api";
import { GetIdentityProfileUseCase } from "./GetIdentityProfileUseCase.js";

export const GetIdentityProfileFeature = createFeature({
    name: "GetIdentityProfile",
    register(container) {
        container.register(GetIdentityProfileUseCase);
    }
});
