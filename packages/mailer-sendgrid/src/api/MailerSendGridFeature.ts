import { createFeature } from "@webiny/feature/api";
import { SendGridMailTransportFactory } from "./SendGridMailTransportFactory.js";

export const MailerSendGridFeature = createFeature({
    name: "MailerSendGrid",
    register(container) {
        container.register(SendGridMailTransportFactory).inSingletonScope();
    }
});
