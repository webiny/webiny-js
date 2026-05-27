import { createImplementation } from "@webiny/di";
import { NewsletterSubscriptionService as Abstraction } from "./abstractions.js";

class NewsletterSubscriptionServiceImpl implements Abstraction.Interface {
    async subscribe(params: { email: string; firstName: string; lastName: string }): Promise<void> {
        if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
            return;
        }
        if (!params.email || !params.firstName || !params.lastName) {
            return;
        }

        try {
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
    dependencies: []
});
