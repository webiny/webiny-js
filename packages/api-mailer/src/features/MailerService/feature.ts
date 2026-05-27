import { createFeature } from "@webiny/feature/api";
import { MailerService } from "./MailerService.js";

export const MailerServiceFeature = createFeature({
    name: "Mailer/MailerService",
    register(container) {
        container.register(MailerService).inSingletonScope();
    }
});
