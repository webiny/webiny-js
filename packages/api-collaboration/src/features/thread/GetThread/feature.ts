import { createFeature } from "@webiny/feature/api";
import { GetThreadRepository } from "./GetThreadRepository.js";
import { GetThreadUseCase } from "./GetThreadUseCase.js";

export const GetThreadFeature = createFeature({
    name: "Collaboration/GetThread",
    register(container) {
        container.register(GetThreadRepository).inSingletonScope();
        container.register(GetThreadUseCase);
    }
});
