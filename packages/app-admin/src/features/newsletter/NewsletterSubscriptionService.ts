import { createImplementation } from "@webiny/di";
import { EnvConfig } from "@webiny/app/features/envConfig";
import { NewsletterSubscriptionService as Abstraction } from "./abstractions.js";

class NewsletterSubscriptionServiceImpl implements Abstraction.Interface {
    constructor(private envConfig: EnvConfig.Interface) {}

    async subscribe(params: { email: string; firstName: string; lastName: string }): Promise<void> {
        if (!this.envConfig.get("telemetryEnabled")) {
            return;
        }
        if (!params.email || !params.firstName || !params.lastName) {
            return;
        }

        try {
            // TODO: use an injectable service here.
            await fetch("https://t.webiny.com/newsletter", {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: JSON.stringify({
                    firstName: params.firstName,
                    lastName: params.lastName,
                    email: params.email,
                    source: "install-wizard"
                })
            });
        } catch {
            // Best-effort: never surface to the user.
        }
    }
}

export const NewsletterSubscriptionService = createImplementation({
    abstraction: Abstraction,
    implementation: NewsletterSubscriptionServiceImpl,
    dependencies: [EnvConfig]
});
