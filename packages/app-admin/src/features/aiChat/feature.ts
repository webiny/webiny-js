import { createFeature } from "@webiny/feature/admin";
import { AiChatGateway } from "./AiChatGateway.js";

export const AiChatFeature = createFeature({
    name: "AiChat",
    register(container) {
        container.register(AiChatGateway);
    }
});
