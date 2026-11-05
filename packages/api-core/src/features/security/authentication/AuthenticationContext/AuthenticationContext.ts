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

// The names jsonwebtoken gives the errors it throws for a token it rejects.
const JWT_ERROR_NAMES = ["TokenExpiredError", "NotBeforeError", "JsonWebTokenError"];

/*
 * Whether an error means the token was rejected, as opposed to authentication failing for another
 * reason, such as a JWKS request timing out or an event handler throwing. Only a rejection becomes an
 * AuthenticationError; anything else keeps its own type, so a transport can answer it as the server
 * error it is instead of telling the client its token is invalid.
 */
function rejectsToken(error: unknown): boolean {
    if (error instanceof AuthenticationError) {
        return true;
    }
    return error instanceof Error && JWT_ERROR_NAMES.includes(error.name);
}

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
            if (rejectsToken(error)) {
                throw AuthenticationError.from(error);
            }
            throw error;
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
