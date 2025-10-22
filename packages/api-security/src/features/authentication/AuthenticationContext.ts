import { createImplementation } from "@webiny/di-container";
import { AuthenticationContext as Abstraction } from "./abstractions.js";
import { Authenticator } from "./shared/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { BeforeLoginEvent, AfterLoginEvent } from "./events.js";
import type { Identity } from "~/features/IdentityContext/Identity.js";
import { AnonymousIdentity, AuthenticatedIdentity } from "~/features/IdentityContext/index.js";

class AuthenticationContextImpl implements Abstraction.Interface {
    private authToken?: string;

    constructor(
        private authenticators: Authenticator.Interface[],
        private eventPublisher: EventPublisher.Interface
    ) {
        const a = 12;
    }

    async authenticate(token: string): Promise<Identity> {
        await this.eventPublisher.publish(new BeforeLoginEvent({ token }));

        // Try each authenticator until one succeeds
        for (const authenticator of this.authenticators) {
            const identity = await authenticator.authenticate(token);
            if (identity) {
                this.authToken = token;

                await this.eventPublisher.publish(new AfterLoginEvent({ identity, token }));

                return new AuthenticatedIdentity(identity);
            }
        }

        return new AnonymousIdentity();
    }

    getAuthToken(): string | undefined {
        return this.authToken;
    }
}

export const AuthenticationContext = createImplementation({
    abstraction: Abstraction,
    implementation: AuthenticationContextImpl,
    dependencies: [[Authenticator, { multiple: true }], EventPublisher]
});
