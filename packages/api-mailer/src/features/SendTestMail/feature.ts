import { createFeature } from "@webiny/feature/api";
import { SendTestMailUseCaseImplementation } from "./SendTestMailUseCase.js";

export const SendTestMailFeature = createFeature({
    name: "SendTestMail",
    register(container) {
        container.register(SendTestMailUseCaseImplementation);
    }
});
