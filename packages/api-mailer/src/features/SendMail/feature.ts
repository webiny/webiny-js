import { createFeature } from "@webiny/feature/api";
import { SendMailUseCaseImplementation } from "./SendMailUseCase.js";
import { MailBeforeSendValidationHandler } from "./MailBeforeSendValidationHandler.js";

export const SendMailFeature = createFeature({
    name: "SendMail",
    register(container) {
        container.register(SendMailUseCaseImplementation);
        container.register(MailBeforeSendValidationHandler);
    }
});
