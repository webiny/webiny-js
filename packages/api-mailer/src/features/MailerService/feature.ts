import { createFeature } from "@webiny/feature/api";
import { MailTransportResolver } from "./MailTransportResolver.js";
import { MailerService } from "./MailerService.js";

export const MailerServiceFeature = createFeature({
    name: "Mailer/MailerService",
    register(container) {
        container.register(MailTransportResolver).inSingletonScope();
        container.register(MailerService).inSingletonScope();
    }
});
