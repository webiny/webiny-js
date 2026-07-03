import { RequestIdentityLoader as Abstraction, RawAuthToken } from "./abstractions.js";
import type { IRawAuthToken } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import type { IAuthenticationContext } from "~/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";

/**
 * LOAD step: authenticates the token set by the transport's EXTRACT step into RawAuthToken and sets
 * IdentityContext. A null/absent token authenticates as anonymous (preserves the previous
 * always-authenticate-the-header behavior). Transport-agnostic.
 */
export class RequestIdentityLoaderImpl implements Abstraction.Interface {
    constructor(
        private authentication: IAuthenticationContext,
        private identityContext: IIdentityContext,
        private rawAuthToken: IRawAuthToken
    ) {}

    async establish(): Promise<void> {
        const token = this.rawAuthToken.get() ?? "";
        const identity = await this.authentication.authenticate(token);
        this.identityContext.setIdentity(identity);
    }
}

export const RequestIdentityLoader = Abstraction.createImplementation({
    implementation: RequestIdentityLoaderImpl,
    dependencies: [AuthenticationContext, IdentityContext, RawAuthToken]
});
