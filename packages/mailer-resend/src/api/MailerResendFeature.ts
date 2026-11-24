import { createFeature } from "@webiny/feature/api";
import { ResendMailTransportFactory } from "./ResendMailTransportFactory.js";

export const MailerResendFeature = createFeature({
    name: "MailerResend",
    register(container) {
        container.register(ResendMailTransportFactory).inSingletonScope();
    }
});
