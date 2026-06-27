import { RequestIdentityEstablisher as Abstraction, AuthTokenExtractor } from "./abstractions.js";
import type { IAuthTokenExtractor } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import type { IAuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";

export class RequestIdentityEstablisherImpl implements Abstraction.Interface {
    constructor(
        private authentication: IAuthenticationContext,
        private identityContext: IIdentityContext,
        private authTokenExtractors: IAuthTokenExtractor[]
    ) {}

    async establish(event: unknown): Promise<void> {
        // Try each token source in registration (priority) order. An extractor returning
        // null/undefined doesn't apply and is skipped; "" is "no token" -> anonymous. The first
        // source that authenticates to a non-anonymous identity wins.
        let identity = undefined;
        for (const extractor of this.authTokenExtractors) {
            const token = extractor.extract(event);
            if (token === null || token === undefined) {
                continue;
            }
            identity = await this.authentication.authenticate(token);
            if (!identity.isAnonymous()) {
                break;
            }
        }

        if (identity === undefined) {
            identity = await this.authentication.authenticate("");
        }

        this.identityContext.setIdentity(identity);
    }
}

export const RequestIdentityEstablisher = Abstraction.createImplementation({
    implementation: RequestIdentityEstablisherImpl,
    dependencies: [AuthenticationContext, IdentityContext, [AuthTokenExtractor, { multiple: true }]]
});
