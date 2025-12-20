import { createFeature } from "@webiny/feature/api";
import { SendMailUseCaseImplementation } from "./SendMailUseCase.js";

export const SendMailFeature = createFeature({
    name: "SendMail",
    register(container) {
        container.register(SendMailUseCaseImplementation);
    }
});
