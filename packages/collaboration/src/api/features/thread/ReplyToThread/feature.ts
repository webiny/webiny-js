import { createFeature } from "@webiny/feature/api";
import { ReplyToThreadUseCase } from "./ReplyToThreadUseCase.js";

export const ReplyToThreadFeature = createFeature({
    name: "Collaboration/ReplyToThread",
    register(container) {
        container.register(ReplyToThreadUseCase);
    }
});
