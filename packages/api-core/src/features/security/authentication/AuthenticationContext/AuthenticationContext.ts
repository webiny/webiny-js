import { createImplementation } from "@webiny/di";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { AuthenticationContext as Abstraction } from "./abstractions.js";
import { Authenticator } from "../Authenticator/index.js";
import { BeforeAuthenticationEvent, AfterAuthenticationEvent } from "./events.js";
import type { Identity } from "~/features/security/IdentityContext/Identity.js";
import {
    AnonymousIdentity,
    AuthenticatedIdentity
} from "~/features/security/IdentityContext/index.js";
import { AuthenticationError } from "./errors.js";

class AuthenticationContextImpl implements Abstraction.Interface {
    private authToken?: string;

    constructor(
        private authenticators: Authenticator.Interface[],
        private eventPublisher: EventPublisher.Interface
    ) {}

    async authenticate(token: string): Promise<Identity> {
        await this.eventPublisher.publish(new BeforeAuthenticationEvent({ token }));

        try {
            return await this.processAuthenticators(token);
        } catch (error) {
            throw AuthenticationError.from(error);
        }
    }

    getAuthToken(): string | undefined {
        return this.authToken;
    }

    private async processAuthenticators(token: string): Promise<Identity> {
        // Try each authenticator until one succeeds
        for (const authenticator of this.authenticators) {
            const identityData = await authenticator.authenticate(token);
            if (identityData) {
                this.authToken = token;

                const identity = new AuthenticatedIdentity(identityData);

                await this.eventPublisher.publish(
                    new AfterAuthenticationEvent({ identity, token })
                );

                return identity;
            }
        }

        return new AnonymousIdentity();
    }
}

export const AuthenticationContext = createImplementation({
    abstraction: Abstraction,
    implementation: AuthenticationContextImpl,
    dependencies: [[Authenticator, { multiple: true }], EventPublisher]
});
