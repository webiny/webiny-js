import { createFeature } from "@webiny/feature/admin";
import { SmtpSettingsPresenter as Abstraction } from "./abstractions.js";
import { SmtpSettingsPresenter } from "./SmtpSettingsPresenter.js";
import { SmtpTestMailGuard } from "./SmtpTestMailGuard.js";

export const SmtpSettingsPresenterFeature = createFeature({
    name: "MailerSmtp/SmtpSettingsPresenter",
    register(container) {
        container.register(SmtpSettingsPresenter).inSingletonScope();
        container.register(SmtpTestMailGuard).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
