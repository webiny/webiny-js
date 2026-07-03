import { createFeature } from "@webiny/feature/admin";
import {
    GetSingletonEntryUseCase as GetUseCase,
    UpdateSingletonEntryUseCase as UpdateUseCase
} from "./abstractions.js";
import { GetSingletonEntryUseCase } from "./GetSingletonEntryUseCase.js";
import { GetSingletonEntryGateway } from "./GetSingletonEntryGateway.js";
import { UpdateSingletonEntryUseCase } from "./UpdateSingletonEntryUseCase.js";
import { UpdateSingletonEntryGateway } from "./UpdateSingletonEntryGateway.js";

export const SingletonEntryFeature = createFeature({
    name: "CmsContentEntry/SingletonEntry",
    register(container) {
        container.register(GetSingletonEntryUseCase);
        container.register(GetSingletonEntryGateway).inSingletonScope();
        container.register(UpdateSingletonEntryUseCase);
        container.register(UpdateSingletonEntryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            getUseCase: container.resolve(GetUseCase),
            updateUseCase: container.resolve(UpdateUseCase)
        };
    }
});
