import { createFeature } from "@webiny/feature/api";
import { MailerService } from "./MailerService.js";
import { ActiveTransport } from "./ActiveTransport.js";

export const MailerServiceFeature = createFeature({
    name: "Mailer/MailerService",
    register(container) {
        container.register(ActiveTransport).inSingletonScope();
        container.register(MailerService).inSingletonScope();
    }
});
